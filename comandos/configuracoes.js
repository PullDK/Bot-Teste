const { EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

// Criar ou abrir o banco de dados
const db = new sqlite3.Database('./DataBase/banco.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados de configurações:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite para configurações');
  }
});

module.exports = {
  data: {
    name: 'configuracoes',
    description: 'Exibe todas as configurações e dados registrados no banco de dados.',
    // Adicionando subcomandos ao comando
    options: [
      {
        name: 'ver',
        description: 'Exibe as configurações registradas no banco de dados.',
        type: 1, // Subcomando
      },
    ],
  },

  execute: async (interaction) => {
    const subcommand = interaction.options.getSubcommand(); // Obtendo o subcomando

    // Verificando se o subcomando "ver" foi usado
    if (subcommand === 'ver') {
      // Criar a embed para exibir as configurações
      const embed = new EmbedBuilder()
        .setTitle('Configurações do Banco de Dados')
        .setColor(0x0099ff)
        .setTimestamp();

      try {
        // Buscar dados das tabelas de regras
        const regrasPromise = new Promise((resolve, reject) => {
          db.all('SELECT id, tipo, pontos, descricao FROM regras', [], (err, rows) => {
            if (err) {
              reject('Houve um erro ao carregar as regras.');
            } else {
              resolve(rows);
            }
          });
        });

        // Buscar dados da tabela de cargos
        const cargosPromise = new Promise((resolve, reject) => {
          db.all('SELECT cargo_id, minimo, maximo FROM cargos', [], (err, rows) => {
            if (err) {
              reject('Houve um erro ao carregar os cargos.');
            } else {
              resolve(rows);
            }
          });
        });

        // Buscar dados da tabela de notificações
        const notificacoesPromise = new Promise((resolve, reject) => {
          db.all('SELECT channel_id FROM notificacoes', [], (err, rows) => {
            if (err) {
              reject('Houve um erro ao carregar as notificações.');
            } else {
              resolve(rows);
            }
          });
        });

        // Buscar dados da tabela de usuários
        const usuariosPromise = new Promise((resolve, reject) => {
          db.all('SELECT id, pontos FROM usuarios', [], (err, rows) => {
            if (err) {
              reject('Houve um erro ao carregar os usuários.');
            } else {
              resolve(rows);
            }
          });
        });

        // Obter os dados de todas as tabelas
        const [regras, cargos, notificacoes, usuarios] = await Promise.all([
          regrasPromise, cargosPromise, notificacoesPromise, usuariosPromise
        ]);

        // Adicionar as regras na embed
        if (regras.length === 0) {
          embed.addFields({ name: 'Regras', value: 'Nenhuma regra foi configurada ainda no banco de dados.' });
        } else {
          let regrasList = '';
          regras.forEach((row) => {
            regrasList += `**ID:** ${row.id}\n**Tipo:** ${row.tipo}\n**Pontos:** ${row.pontos}\n**Descrição:** ${row.descricao}\n\n`;
          });
          embed.addFields({ name: 'Regras Registradas', value: regrasList });
        }

        // Adicionar os cargos na embed
        if (cargos.length === 0) {
          embed.addFields({ name: 'Cargos', value: 'Nenhum cargo foi configurado ainda no banco de dados.' });
        } else {
          let cargosList = '';
          for (const row of cargos) {
            const cargo = await interaction.guild.roles.fetch(row.cargo_id);  // Buscar o cargo pelo ID
            cargosList += `**Cargo:** <@&${row.cargo_id}>\n**Mínimo:** ${row.minimo} pontos\n**Máximo:** ${row.maximo} pontos\n\n`;
          }
          embed.addFields({ name: 'Cargos Registrados', value: cargosList });
        }

        // Adicionar as notificações na embed
        if (notificacoes.length === 0) {
          embed.addFields({ name: 'Notificações', value: 'Nenhum canal de notificações foi configurado ainda.' });
        } else {
          let notificacoesList = '';
          notificacoes.forEach((row) => {
            notificacoesList += `**Canal:** <#${row.channel_id}>\n`;
          });
          embed.addFields({ name: 'Canais de Notificação', value: notificacoesList });
        }

        // Adicionar os usuários na embed
        if (usuarios.length === 0) {
          embed.addFields({ name: 'Usuários', value: 'Nenhum usuário registrado com pontos ainda.' });
        } else {
          let usuariosList = '';
          for (const row of usuarios) {
            const user = await interaction.client.users.fetch(row.id); // Buscar o usuário pelo ID
            usuariosList += `**Usuário:** <@${row.id}>\n**Pontos:** ${row.pontos}\n\n`;
          }
          embed.addFields({ name: 'Usuários Registrados', value: usuariosList });
        }

        // Enviar a embed apenas para o usuário que executou o comando (ephemeral: true)
        return interaction.reply({ embeds: [embed], ephemeral: true });

      } catch (error) {
        console.error(error);
        return interaction.reply({ content: 'Houve um erro ao carregar as configurações.', ephemeral: true });
      }
    }
  },
};
