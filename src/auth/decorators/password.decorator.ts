import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }
          const hasUpperCase = /[A-Z]/.test(value);
          const hasLowerCase = /[a-z]/.test(value);
          const hasNumber = /\d/.test(value);
          const hasSpecialCharacter = /[\W_]/.test(value);
          const isLongEnough = value.length >= 8;
          return (
            hasUpperCase &&
            hasLowerCase &&
            hasNumber &&
            hasSpecialCharacter &&
            isLongEnough
          );
        },
        defaultMessage(args: ValidationArguments) {
          return 'A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula, um número e um caractere especial';
        },
      },
    });
  };
}
