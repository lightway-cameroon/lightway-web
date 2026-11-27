import * as fs from 'node:fs';
import * as path from 'node:path';

const backendPath = process.env['LIGHTWAY_BACKEND_PATH'] || '../lightway-backend';
const schemaUrl = process.env['LIGHTWAY_SCHEMA_URL'];
const targetSchemaPath = path.resolve('schema/schema.graphql');

async function syncSchema() {
  console.log('[schema:sync] Recherche du contrat de schéma GraphQL...');

  // 1. Try local clone
  const localSchemaFile = path.resolve(backendPath, 'contracts/graphql/schema.graphql');
  if (fs.existsSync(localSchemaFile)) {
    console.log(`[schema:sync] Copie depuis le dépôt local : ${localSchemaFile}`);
    fs.mkdirSync(path.dirname(targetSchemaPath), { recursive: true });
    fs.copyFileSync(localSchemaFile, targetSchemaPath);
    console.log(`[schema:sync] Schéma synchronisé avec succès vers ${targetSchemaPath}`);
    return;
  }

  // 2. Try remote URL
  if (schemaUrl) {
    console.log(`[schema:sync] Téléchargement depuis l'URL : ${schemaUrl}`);
    try {
      const res = await fetch(schemaUrl);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const content = await res.text();
      fs.mkdirSync(path.dirname(targetSchemaPath), { recursive: true });
      fs.writeFileSync(targetSchemaPath, content, 'utf-8');
      console.log(`[schema:sync] Schéma synchronisé avec succès vers ${targetSchemaPath}`);
      return;
    } catch (err) {
      console.error(`[schema:sync] Échec du téléchargement :`, err);
      process.exit(1);
    }
  }

  console.warn(
    `[schema:sync] Avertissement : Impossible de trouver le schéma GraphQL backend.
Ni '${localSchemaFile}' n'existe, ni LIGHTWAY_SCHEMA_URL n'est configuré.
Si le backend n'est pas encore prêt, le fichier schema/.gitkeep est conservé.`,
  );
}

syncSchema();
