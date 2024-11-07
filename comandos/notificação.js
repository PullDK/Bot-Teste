const { EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

// Criar ou abrir o banco de dados para as notificações
const db = new sqlite3.Database('./DataBase/banco.db', (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados de notificações:", err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite para notificações');
  }
});

// Criar a tabela de notificações se não existir
db.run(`
  CREATE TABLE IF NOT EXISTS notificacoes (
    channel_id TEXT PRIMARY KEY
  );
`);

module.exports = {
  data: {
    name: 'notificação',
    description: 'Gerenciar canais de notificação',
    options: [
      {
        type: 1, // Tipo SUB_COMMAND
        name: 'adicionar',
        description: 'Adicionar um canal para notificações',
        options: [
          {
            type: 7, // Tipo CHANNEL
            name: 'canal',
            description: 'O canal para adicionar',
            required: true,
          },
        ],
      },
      {
        type: 1, // Tipo SUB_COMMAND
        name: 'remover',
        description: 'Remover um canal de notificações',
        options: [
          {
            type: 7, // Tipo CHANNEL
            name: 'canal',
            description: 'O canal para remover',
            required: true,
          },
        ],
      },
      {
        type: 1, // Tipo SUB_COMMAND
        name: 'mostrar',
        description: 'Mostrar todos os canais de notificação',
      },
    ],
  },

  execute: async (interaction, subcommand) => {
    if (subcommand === 'adicionar') {
      const canal = interaction.options.getChannel('canal');

      // Adicionar canal ao banco de dados
      db.run('INSERT OR IGNORE INTO notificacoes (channel_id) VALUES (?)', [canal.id], function (err) {
        if (err) {
          console.error(err.message);
          return interaction.reply('Houve um erro ao adicionar o canal de notificação.');
        }

        if (this.changes > 0) {
          return interaction.reply({ content:`Canal ${canal} foi adicionado às notificações.`, ephemeral: true });
        } else {
          return interaction.reply({ content:`{ content:O canal ${canal} já está registrado nas notificações.`, ephemeral: true });
        }
      });
    } else if (subcommand === 'remover') {
      const canal = interaction.options.getChannel('canal');

      // Remover canal do banco de dados
      db.run('DELETE FROM notificacoes WHERE channel_id = ?', [canal.id], function (err) {
        if (err) {
          console.error(err.message);
          return interaction.reply('Houve um erro ao remover o canal de notificação.');
        }

        if (this.changes > 0) {
          return interaction.reply({ content:`Canal ${canal} foi removido das notificações.`, ephemeral: true });
        } else {
          return interaction.reply({ content:`O canal ${canal} não está registrado nas notificações.`, ephemeral: true });
        }
      });
    } else if (subcommand === 'mostrar') {
      // Buscar todos os canais de notificação registrados
      db.all('SELECT channel_id FROM notificacoes', [], (err, rows) => {
        if (err) {
          console.error(err.message);
          return interaction.reply({ content:'Houve um erro ao carregar os canais de notificação.'});
        }

        // Criar a embed com a lista de canais
        const embed = new EmbedBuilder()
          .setTitle('Canais de Notificação')
          .setColor(0x0099ff) // Cor azul
          .setTimestamp();

        if (rows.length === 0) {
          embed.setDescription('Nenhum canal de notificação registrado.');
        } else {
          let canaisList = '';
          rows.forEach((row, index) => {
            const channel = interaction.guild.channels.cache.get(row.channel_id);
            canaisList += `${index + 1}. ${channel ? channel.toString() : 'Canal não encontrado'}\n`;
          });

          embed.setDescription(canaisList);
        }

        interaction.reply({ embeds: [embed] });
      });
    }
  },
};
