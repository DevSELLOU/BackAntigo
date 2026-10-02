import { Injectable } from '@nestjs/common';
import { City } from './city.entity';

@Injectable()
export class CitiesService {
  async findAll() {
    return City.findAll();
  }

  async syncCoordinatesFromIBGE() {
    try {
      const response = await fetch(
        'https://servicodados.ibge.gov.br/api/v1/localidades/municipios',
      );
      if (!response.ok) {
        throw new Error(`IBGE API responded with ${response.status}`);
      }

      const municipalities = (await response.json()) as Array<{
        id: number;
        nome: string;
        microrregiao: {
          mesorregiao: {
            UF: {
              sigla: string;
            };
          };
        };
        municipio: {
          id: { id: number };
          nome: string;
          centroide: {
            longitude: string;
            latitude: string;
          };
        };
      }>;

      let updated = 0;
      let skipped = 0;

      for (const m of municipalities) {
        const name = m.nome;
        const stateAbbreviation = m.microrregiao?.mesorregiao?.UF?.sigla;

        if (!name || !stateAbbreviation) {
          skipped++;
          continue;
        }

        const city = await City.findOne({
          where: { name, stateAbbreviation },
        });

        if (!city) {
          skipped++;
          continue;
        }

        // IBGE API returns coordinates in municipio.centroide for some versions
        // Try to get from the response structure
        let latitude: string | undefined;
        let longitude: string | undefined;

        if ((m as any).municipio?.centroide?.latitude) {
          latitude = (m as any).municipio.centroide.latitude;
          longitude = (m as any).municipio.centroide.longitude;
        }

        if (latitude && longitude) {
          city.latitude = latitude;
          city.longitude = longitude;
          await city.save();
          updated++;
        } else {
          skipped++;
        }
      }

      return { updated, skipped, total: municipalities.length };
    } catch (error) {
      throw new Error(`Failed to sync coordinates: ${error.message}`);
    }
  }
}
