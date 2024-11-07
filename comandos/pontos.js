const { EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

// Abrir ou criar o banco de dados de pontos
const db = new sqlite3.Database('./DataBase/banco.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados de pontos:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite para pontos');
  }
});

// Criar a tabela de usuários caso ela não exista
db.run(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    pontos INTEGER DEFAULT 0
  );
`);

// Função para obter cargos de um usuário
const getUserRoles = (userId, guild) => {
  const member = guild.members.cache.get(userId);
  if (!member) return null;

  const roles = member.roles.cache
    .filter(role => role.id !== guild.id) // Remove a @everyone role
    .map(role => role.name)
    .join(', ');

  return roles || 'Nenhum cargo';
};

module.exports = {
  data: {
    name: 'pontos',
    description: 'Gerenciar os pontos dos usuários',
    options: [
      {
        type: 1, // Tipo SUB_COMMAND
        name: 'adicionar',
        description: 'Adicionar pontos a um usuário',
        options: [
          {
            type: 6, // Tipo USER
            name: 'usuario',
            description: 'O usuário para adicionar pontos',
            required: true,
          },
          {
            type: 4, // Tipo INTEGER
            name: 'quantidade',
            description: 'Quantidade de pontos a adicionar',
            required: true,
          },
          {
            type: 3, // Tipo STRING
            name: 'motivo',
            description: 'Motivo para adicionar os pontos',
            required: true,
          },
        ],
      },
      {
        type: 1, // Tipo SUB_COMMAND
        name: 'remover',
        description: 'Remover pontos de um usuário',
        options: [
          {
            type: 6, // Tipo USER
            name: 'usuario',
            description: 'O usuário para remover pontos',
            required: true,
          },
          {
            type: 4, // Tipo INTEGER
            name: 'quantidade',
            description: 'Quantidade de pontos a remover',
            required: true,
          },
          {
            type: 3, // Tipo STRING
            name: 'motivo',
            description: 'Motivo para remover os pontos',
            required: true,
          },
        ],
      },
      {
        type: 1, // Tipo SUB_COMMAND
        name: 'ver',
        description: 'Ver pontos de todos os usuários',
      },
    ],
  },

  execute: async (interaction, subcommand) => {
    const usuario = interaction.options.getUser('usuario');
    const quantidade = interaction.options.getInteger('quantidade');
    const motivo = interaction.options.getString('motivo');

    if (subcommand === 'adicionar') {
      // Adicionar pontos no banco de dados
      db.get('SELECT pontos FROM usuarios WHERE id = ?', [usuario.id], (err, row) => {
        if (err) {
          console.error(err.message);
          return interaction.reply('Houve um erro ao acessar o banco de dados.');
        }

        let novosPontos = row ? row.pontos + quantidade : quantidade;

        db.run('INSERT OR REPLACE INTO usuarios (id, pontos) VALUES (?, ?)', [usuario.id, novosPontos], function (err) {
          if (err) {
            console.error(err.message);
            return interaction.reply('Erro ao adicionar pontos.');
          }

          const message = `
            **Quem recebeu os pontos:** \n${usuario}
            **Pontos:** \n${quantidade}
            **Motivo:** \n${motivo}
            **Quem adicionou:** \n${interaction.user}\n
          `;

          // Enviar a notificação para os canais registrados
          sendNotification(interaction.client, interaction, message, true);

          // Atualizar cargos após adicionar os pontos
          updateCargos(usuario.id, novosPontos, interaction.guild);

          return interaction.reply({ content: `Adicionados ${quantidade} pontos para ${usuario}. Motivo: ${motivo}`, ephemeral: true });
        });
      });
    } else if (subcommand === 'remover') {
      // Remover pontos no banco de dados
      db.get('SELECT pontos FROM usuarios WHERE id = ?', [usuario.id], (err, row) => {
        if (err) {
          console.error(err.message);
          return interaction.reply('Houve um erro ao acessar o banco de dados.');
        }

        if (!row || row.pontos < quantidade) {
          return interaction.reply({ content:`${usuario} não tem pontos suficientes para ser removido.`, ephemeral: true });
        }

        let novosPontos = row.pontos - quantidade;

        db.run('INSERT OR REPLACE INTO usuarios (id, pontos) VALUES (?, ?)', [usuario.id, novosPontos], function (err) {
          if (err) {
            console.error(err.message);
            return interaction.reply({ content:'Erro ao remover pontos.' });
          }

          const message = `
            **Quem perdeu os pontos:** \n${usuario}
            **Pontos:** \n${quantidade}
            **Motivo:** \n${motivo}
            **Quem removeu:** \n${interaction.user}\n
          `;

          // Enviar a notificação para os canais registrados
          sendNotification(interaction.client, interaction, message, false);

          // Atualizar cargos após remover os pontos
          updateCargos(usuario.id, novosPontos, interaction.guild);

          return interaction.reply({ content:`Removidos ${quantidade} pontos de ${usuario}.`, ephemeral: true });
        });
      });
    } else if (subcommand === 'ver') {
      // Ver os pontos de todos os usuários
      db.all('SELECT id, pontos FROM usuarios', [], async (err, rows) => {
        if (err) {
          console.error(err.message);
          return interaction.reply('Houve um erro ao acessar o banco de dados.');
        }

        if (rows.length === 0) {
          return interaction.reply({ content: 'Não há usuários registrados com pontos.', ephemeral: true  });
        }

        // Criar a embed
        const embed = new EmbedBuilder()
          .setTitle('**Pontos de Todos os Usuários**')
          .setColor(0x0099ff)
          .setTimestamp();

        // Adicionar os usuários e seus pontos na embed
        for (const row of rows) {
          const user = await interaction.guild.members.fetch(row.id);
          const roles = getUserRoles(row.id, interaction.guild);

          // Adicionar cada usuário com seu nome, pontos e cargos
          embed.addFields({
            name: `@${user.user.username}`,
            value: `Pontos: **${row.pontos}**\nCargo(s): ${roles}`,
            inline: false,
          });
        }

        // Enviar embed apenas para o usuário que enviou o comando
        return interaction.reply({ content: 'Aqui estão os pontos de todos os usuários:', embeds: [embed], ephemeral: true });
      });
    }
  },
};

// Função para enviar uma notificação (para canais registrados)
async function sendNotification(client, interaction, message, isAdd) {
  const notificationChannels = []; // Vamos armazenar os canais aqui

  // Obter os canais de notificação registrados
  db.all('SELECT channel_id FROM notificacoes', [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return;
    }

    // Obter os canais de notificação do banco de dados
    rows.forEach((row) => {
      const channel = interaction.guild.channels.cache.get(row.channel_id);
      if (channel) notificationChannels.push(channel);
    });

    if (notificationChannels.length === 0) {
      console.log('Não há canais de notificação registrados.');
      return;
    }

    // Definir a cor da embed dependendo se os pontos foram adicionados ou removidos
    const embedColor = isAdd ? 0x00ff00 : 0xff0000; // Verde para adicionar, vermelho para remover

    // Criar a embed
    const embed = new EmbedBuilder()
      .setTitle(isAdd ? 'Pontos Adicionados' : 'Pontos Removidos')
      .setColor(embedColor)
      .setDescription(message)
      .setTimestamp();

    // Enviar para todos os canais de notificação
    notificationChannels.forEach((channel) => {
      channel.send({ embeds: [embed] });
    });
  });
}

// Função para atualizar cargos de um usuário após a adição ou remoção de pontos
const updateCargos = (userId, pontos, guild) => {
  console.log(`Atualizando cargos para o usuário ${userId} com ${pontos} pontos`);

  // Buscar todos os cargos registrados no banco de dados
  db.all('SELECT cargo_id, minimo, maximo FROM cargos', [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar cargos:', err.message);
      return;
    }

    if (rows.length === 0) {
      console.log('Nenhum cargo registrado no banco de dados');
      return;
    }

    rows.forEach((row) => {
      const cargo = guild.roles.cache.get(row.cargo_id);
      if (!cargo) {
        console.log(`Cargo ${row.cargo_id} não encontrado na guilda`);
        return;
      }

      console.log(`Verificando cargo ${cargo.name} para pontos ${pontos}: Intervalo ${row.minimo} - ${row.maximo}`);

      const member = guild.members.cache.get(userId);
      if (!member) {
        console.log(`Membro ${userId} não encontrado na guilda`);
        return;
      }

      // Verificar se os pontos do usuário estão dentro do intervalo
      if (pontos >= row.minimo && pontos <= row.maximo) {
        // Adicionar o cargo caso o usuário não tenha
        if (!member.roles.cache.has(cargo.id)) {
          console.log(`Adicionando o cargo ${cargo.name} ao usuário ${userId}`);
          member.roles.add(cargo).catch(console.error);
        } else {
          console.log(`O usuário ${userId} já tem o cargo ${cargo.name}`);
        }
      } else {
        // Caso o usuário tenha pontos fora do intervalo, remover o cargo
        if (member.roles.cache.has(cargo.id)) {
          console.log(`Removendo o cargo ${cargo.name} do usuário ${userId}`);
          member.roles.remove(cargo).catch(console.error);
        }
      }
    });
  });
};
