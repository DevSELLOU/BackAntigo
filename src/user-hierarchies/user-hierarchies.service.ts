import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { UserHierarchy } from './user-hierarchy.entity';
import { User } from '../users/user.entity';
import { UserRole, UserRoleHierarchy } from '../users/enums/user-role.enum'; // Assuming this path
import { CompaniesService } from 'src/companies/companies.service';
import { UsersService } from 'src/users/users.service';

export interface UserNode {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  position: string;
  managerId?: number | null;
  subordinates?: UserNode[];
}

@Injectable()
export class UserHierarchiesService {
  constructor(
    @Inject('USER_HIERARCHY_REPOSITORY')
    private userHierarchyModel: typeof UserHierarchy,
    private readonly usersService: UsersService,
    @Inject(CompaniesService)
    private readonly companiesService: CompaniesService,
  ) {}

  private sortSubordinates(nodes: UserNode[]) {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    for (const node of nodes) {
      if (node.subordinates) {
        this.sortSubordinates(node.subordinates);
      }
    }
  }

  async assignManager(
    subordinateId: number,
    managerId: number,
    companyId: number,
  ): Promise<UserHierarchy> {
    const subordinate = await this.usersService.findOne(subordinateId);
    const manager = await this.usersService.findOne(managerId);

    if (!subordinate || subordinate.companyId !== companyId) {
      throw new BadRequestException(
        'Subordinate user not found in this company.',
      );
    }
    if (!manager || manager.companyId !== companyId) {
      throw new BadRequestException('Manager user not found in this company.');
    }

    if (!subordinate) {
      throw new BadRequestException('Subordinate user not found.');
    }
    if (!manager) {
      throw new BadRequestException('Manager user not found.');
    }

    const canManage = (mRole: UserRole, sRole: UserRole): boolean => {
      return UserRoleHierarchy[mRole] > UserRoleHierarchy[sRole];
    };

    if (!canManage(manager.role, subordinate.role)) {
      throw new BadRequestException(
        `Manager role (${manager.role}) is not high enough to manage user role (${subordinate.role}).`,
      );
    }

    // 3. Prevent self-management or circular dependencies (add more robust checks as needed)
    if (subordinateId === managerId) {
      throw new BadRequestException('A user cannot be their own manager.');
    }

    // 4. Create or update the hierarchy relationship
    const [hierarchy, created] = await this.userHierarchyModel.findOrCreate({
      where: { subordinateId },
      defaults: {
        subordinateId,
        managerId,
        companyId,
      },
    });

    if (!created) {
      // If relationship already exists, update the manager
      hierarchy.managerId = managerId;
      await hierarchy.save();
    }

    return hierarchy;
  }

  async getManagerForUser(
    userId: number,
    companyId: number,
  ): Promise<User | null> {
    const hierarchy = await this.userHierarchyModel.findOne({
      where: { subordinateId: userId },
      include: [
        {
          model: User,
          as: 'manager',
          where: { companyId },
        },
      ],
    });
    return hierarchy ? hierarchy.manager : null;
  }

  async getSubordinatesForUser(
    managerId: number,
    companyId: number,
  ): Promise<User[]> {
    const hierarchies = await this.userHierarchyModel.findAll({
      where: { managerId },
      include: [
        {
          model: User,
          as: 'subordinate',
          where: { companyId },
        },
      ],
    });
    return hierarchies.map((h) => h.subordinate);
  }

  async updateManager(
    subordinateId: number,
    newManagerId: number,
    companyId: number,
  ): Promise<UserHierarchy> {
    const hierarchy = await this.userHierarchyModel.findOne({
      where: { subordinateId },
    });

    if (!hierarchy) {
      throw new NotFoundException(
        `Hierarchy relationship not found for subordinate ID ${subordinateId}.`,
      );
    }

    const subordinate = await this.usersService.findOne(subordinateId);
    const newManager = await this.usersService.findOne(newManagerId);

    if (!subordinate || subordinate.companyId !== companyId) {
      throw new BadRequestException(
        'Subordinate user not found in this company.',
      );
    }
    if (!newManager || newManager.companyId !== companyId) {
      throw new BadRequestException(
        'New manager user not found in this company.',
      );
    }

    const canManage = (mRole: UserRole, sRole: UserRole): boolean => {
      return UserRoleHierarchy[mRole] > UserRoleHierarchy[sRole];
    };

    if (!canManage(newManager.role, subordinate.role)) {
      throw new BadRequestException(
        `New manager role (${newManager.role}) is not high enough to manage user role (${subordinate.role}).`,
      );
    }

    if (subordinateId === newManagerId) {
      throw new BadRequestException('A user cannot be their own manager.');
    }

    hierarchy.managerId = newManagerId;
    await hierarchy.save();
    return hierarchy;
  }

  async removeManager(subordinateId: number, companyId: number): Promise<void> {
    const hierarchyToRemove = await this.userHierarchyModel.findOne({
      where: { subordinateId },
      include: [
        {
          model: User,
          as: 'manager',
          where: { companyId },
          required: true,
        },
      ],
    });

    if (!hierarchyToRemove) {
      throw new NotFoundException(
        `Hierarchy relationship not found for subordinate ID ${subordinateId} in company ${companyId}.`,
      );
    }

    await hierarchyToRemove.destroy();
  }

  async getCompanyHierarchyTree(companyId: number): Promise<UserNode[]> {
    const company = await this.companiesService.findOne(companyId);
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found.`);
    }

    const { data: allCompanyUsers } = await this.usersService.findCompanyUsers(
      companyId,
      {
        page: 1,
        limit: 9999,
      },
    );

    const usersWithManager = new Set<number>();
    const usersWithSubordinates = new Set<number>();

    const hierarchies = await this.userHierarchyModel.findAll({
      attributes: ['managerId', 'subordinateId'],
      include: [
        {
          model: User,
          as: 'manager',
          where: { companyId },
          attributes: [],
          required: true,
        },
        {
          model: User,
          as: 'subordinate',
          where: { companyId },
          attributes: [],
          required: true,
        },
      ],
    });

    for (const hierarchy of hierarchies) {
      usersWithSubordinates.add(hierarchy.managerId);
      usersWithManager.add(hierarchy.subordinateId);
    }

    const filteredUsers = allCompanyUsers.filter(
      (user) =>
        usersWithManager.has(user.id) || usersWithSubordinates.has(user.id),
    );

    const usersMap = new Map<number, UserNode>();
    const hierarchyMap = new Map<number, number | null>();

    for (const user of filteredUsers) {
      usersMap.set(user.id, {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        managerId: hierarchyMap.get(user.id) || null,
      });

      const managerRelation = hierarchies.find(
        (h) => h.subordinateId === user.id,
      );
      hierarchyMap.set(
        user.id,
        managerRelation ? managerRelation.managerId : null,
      );
    }

    const tree: UserNode[] = [];

    for (const user of filteredUsers) {
      const userNode = usersMap.get(user.id);
      if (!userNode) continue;

      const managerId = hierarchyMap.get(user.id);

      if (managerId === null || !usersMap.has(managerId)) {
        tree.push(userNode);
      } else {
        const managerNode = usersMap.get(managerId);
        if (managerNode) {
          if (!managerNode.subordinates) {
            managerNode.subordinates = [];
          }
          userNode.managerId = managerId;
          managerNode.subordinates.push(userNode);
        }
      }
    }

    this.sortSubordinates(tree);

    return tree;
  }
}
