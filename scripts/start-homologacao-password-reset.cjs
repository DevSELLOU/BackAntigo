'use strict';

// Temporary Render Docker Command. API starts only after the transaction finishes.
require('./reset-homologacao-passwords.cjs').main()
  .then(() => require('./start-homologacao.cjs'))
  .catch(() => {
    console.error('HOMOLOG_PASSWORD_RESET failed; API nao iniciada. Confira configuracao e identidades ficticias.');
    process.exitCode = 1;
  });
