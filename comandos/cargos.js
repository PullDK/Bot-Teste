const { EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

// Abrir ou criar o banco de dados de cargos
const db = new sqlite3.Database('./DataBase/banco.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados de cargos:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite para cargos');
  }
});

// Criar a tabela de cargos caso ela não exista
db.run(`
  CREATE TABLE IF NOT EXISTS cargos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cargo_id TEXT NOT NULL,
    minimo INTEGER NOT NULL,
    maximo INTEGER NOT NULL
  );
`);

module.exports = {
  data: {
    name: 'cargos',
    description: 'Gerenciar os cargos de usuários',
    options: [
      {
        type: 1, // Tipo SUB_COMMAND
        name: 'registrar',
        description: 'Registrar um cargo e seu intervalo de pontos',
        options: [
          {
            type: 8, // Tipo ROLE (Agora seleciona os cargos)
            name: 'cargo',
            description: 'Cargo a ser registrado',
            required: true,
          },
          {
            type: 4, // Tipo INTEGER
            name: 'minimo',
            description: 'Pontos mínimos para receber o cargo',
            required: true,
          },
          {
            type: 4, // Tipo INTEGER
            name: 'maximo',
            description: 'Pontos máximos para receber o cargo',
            required: true,
          },
        ],
      },
      {
        type: 1, // Tipo SUB_COMMAND
        name: 'remover',
        description: 'Remover um cargo registrado',
        options: [
          {
            type: 8, // Tipo ROLE (Agora seleciona os cargos)
            name: 'cargo',
            description: 'Cargo a ser removido',
            required: true,
          },
        ],
      },
      {
        type: 1, // Tipo SUB_COMMAND
        name: 'ver',
        description: 'Ver todos os cargos registrados',
      },
    ],
  },

  execute: async (interaction) => {
    const subcommand = interaction.options.getSubcommand();  // Corrigido para extrair o subcomando

    if (subcommand === 'registrar') {
      const cargo = interaction.options.getRole('cargo');
      const minimo = interaction.options.getInteger('minimo');
      const maximo = interaction.options.getInteger('maximo');

      // Registrar um novo cargo no banco de dados
      db.run('INSERT INTO cargos (cargo_id, minimo, maximo) VALUES (?, ?, ?)', [cargo.id, minimo, maximo], function (err) {
        if (err) {
          console.error(err.message);
          return interaction.reply({ content: 'Erro ao registrar o cargo.', ephemeral: true });
        }

        return interaction.reply({ content: `Cargo ${cargo.name} registrado com intervalo de ${minimo} a ${maximo} pontos.`, ephemeral: true });
      });
    } else if (subcommand === 'remover') {
      const cargo = interaction.options.getRole('cargo');

      // Remover o cargo do banco de dados
      db.run('DELETE FROM cargos WHERE cargo_id = ?', [cargo.id], function (err) {
        if (err) {
          console.error(err.message);
          return interaction.reply({ content: 'Erro ao remover o cargo.', ephemeral: true });
        }

        return interaction.reply({ content: `Cargo ${cargo.name} removido.`, ephemeral: true });
      });
    } else if (subcommand === 'ver') {
      // Obter todos os cargos registrados
      db.all('SELECT cargo_id, minimo, maximo FROM cargos', [], (err, rows) => {
        if (err) {
          console.error(err.message);
          return interaction.reply({ content: 'Houve um erro ao acessar os dados de cargos.', ephemeral: true });
        }

        if (rows.length === 0) {
          console.log('Nenhum cargo registrado');
          return interaction.reply({ content: 'Nenhum cargo registrado no banco de dados.', ephemeral: true });
        }

        // Criar uma embed com os cargos e seus intervalos de pontos
        const embed = new EmbedBuilder()
          .setTitle('Cargos Registrados')
          .setColor(0x0099ff) // Cor padrão para a embed
          .setTimestamp();

        rows.forEach((row) => {
          // Obter o nome do cargo usando o cargo_id
          const cargo = interaction.guild.roles.cache.get(row.cargo_id);
          if (cargo) {
            // Adiciona um campo para cada cargo registrado, no formato desejado
            embed.addFields({
              name: `Cargo: @${cargo.name}`, // Exibe o nome do cargo com @
              value: `Pontos: ${row.minimo} - ${row.maximo}`,
              inline: false, // Exibe os cargos em campos separados
            });
          } else {
            console.log(`Cargo com ID ${row.cargo_id} não encontrado no cache.`);
          }
        });

        // Caso não encontre cargos, adicione uma mensagem informativa
        if (embed.data.fields.length === 0) {
          embed.setDescription('Nenhum cargo válido encontrado.');
        }

        return interaction.reply({ content: '', embeds: [embed], ephemeral: true });
      });
    }
  },
};
