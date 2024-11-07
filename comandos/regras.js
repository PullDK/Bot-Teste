const { EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./DataBase/banco.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados de regras:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite para regras');
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS regras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL,
    pontos INTEGER NOT NULL,
    descricao TEXT NOT NULL
  );
`);

module.exports = {
  data: {
    name: 'regras',
    description: 'Gerenciar as regras do servidor',
    options: [
      {
        type: 1,
        name: 'adicionar',
        description: 'Adicionar uma nova regra',
        options: [
          {
            type: 3,
            name: 'tipo',
            description: 'Tipo de regra (ganhar/perder)',
            required: true,
          },
          {
            type: 4,
            name: 'pontos',
            description: 'Quantidade de pontos para a regra',
            required: true,
          },
          {
            type: 3,
            name: 'descricao',
            description: 'Descrição da regra',
            required: true,
          },
        ],
      },
      {
        type: 1,
        name: 'remover',
        description: 'Remover uma regra existente',
        options: [
          {
            type: 4,
            name: 'id',
            description: 'ID da regra a ser removida',
            required: true,
          },
        ],
      },
      {
        type: 1,
        name: 'editar',
        description: 'Editar uma regra existente',
        options: [
          {
            type: 4,
            name: 'id',
            description: 'ID da regra a ser editada',
            required: true,
          },
          {
            type: 4,
            name: 'pontos',
            description: 'Novos pontos para a regra',
            required: false,
          },
          {
            type: 3,
            name: 'descricao',
            description: 'Nova descrição da regra',
            required: false,
          },
        ],
      },
      {
        type: 1,
        name: 'id',
        description: 'Ver as regras com os IDs',
      },
      {
        type: 1,
        name: 'ver',
        description: 'Ver todas as regras',
      },
    ],
  },

  execute: async (interaction) => {
    const subcommand = interaction.options.getSubcommand(); // Certificando-se que o subcomando está sendo extraído corretamente
    console.log("Comando recebido:", subcommand);  // Log de depuração

    if (subcommand === 'adicionar') {
      const tipo = interaction.options.getString('tipo');
      const pontos = interaction.options.getInteger('pontos');
      const descricao = interaction.options.getString('descricao');

      console.log(`Adicionando regra: tipo=${tipo}, pontos=${pontos}, descricao=${descricao}`);

      db.run(
        'INSERT INTO regras (tipo, pontos, descricao) VALUES (?, ?, ?)',
        [tipo, pontos, descricao],
        function (err) {
          if (err) {
            console.error('Erro ao adicionar regra:', err.message);
            return interaction.reply('Houve um erro ao adicionar a regra.');
          }

          console.log(`Regra adicionada com sucesso. ID: ${this.lastID}`);
          return interaction.reply({ content:`A regra foi adicionada com sucesso. ID da regra: ${this.lastID}`, ephemeral: true });
        }
      );
    } else if (subcommand === 'remover') {
      const id = interaction.options.getInteger('id');
      console.log(`Removendo regra com ID: ${id}`);

      db.run('DELETE FROM regras WHERE id = ?', [id], function (err) {
        if (err) {
          console.error('Erro ao remover regra:', err.message);
          return interaction.reply('Houve um erro ao remover a regra.');
        }

        if (this.changes > 0) {
          console.log(`Regra com ID ${id} removida.`);
          return interaction.reply({ content:`Regra com ID ${id} foi removida com sucesso.`, ephemeral: true });
        } else {
          console.log(`Nenhuma regra encontrada com ID ${id}.`);
          return interaction.reply({ content:`Não foi encontrada nenhuma regra com ID ${id}.`, ephemeral: true });
        }
      });
    } else if (subcommand === 'editar') {
      const id = interaction.options.getInteger('id');
      const pontos = interaction.options.getInteger('pontos');
      const descricao = interaction.options.getString('descricao');

      console.log(`Editando regra com ID: ${id}, novos pontos: ${pontos}, nova descrição: ${descricao}`);

      // Se ambos os campos não forem informados, informar o erro
      if (!pontos && !descricao) {
        return interaction.reply({ content: 'Você deve fornecer pelo menos um valor para editar: pontos ou descrição.', ephemeral: true });
      }

      // Atualizando no banco de dados
      let updateQuery = 'UPDATE regras SET ';
      let updateValues = [];

      if (pontos) {
        updateQuery += 'pontos = ?, ';
        updateValues.push(pontos);
      }
      if (descricao) {
        updateQuery += 'descricao = ?, ';
        updateValues.push(descricao);
      }

      // Remover a vírgula extra
      updateQuery = updateQuery.slice(0, -2);
      updateQuery += ' WHERE id = ?';
      updateValues.push(id);

      db.run(updateQuery, updateValues, function (err) {
        if (err) {
          console.error('Erro ao editar regra:', err.message);
          return interaction.reply('Houve um erro ao editar a regra.');
        }

        if (this.changes > 0) {
          console.log(`Regra com ID ${id} editada com sucesso.`);
          return interaction.reply({ content:`Regra com ID ${id} foi editada com sucesso.`, ephemeral: true });
        } else {
          console.log(`Nenhuma regra encontrada com ID ${id}.`);
          return interaction.reply({ content:`Não foi encontrada nenhuma regra com ID ${id}.`, ephemeral: true });
        }
      });
    }else if (subcommand === 'id') {
        console.log('Exibindo regras com IDs');
      
        db.all('SELECT id, tipo, pontos, descricao FROM regras', [], (err, rows) => {
          if (err) {
            console.error('Erro ao carregar as regras:', err.message);
            return interaction.reply({ content: 'Houve um erro ao carregar as regras.', ephemeral: true });
          }
      
          if (rows.length === 0) {
            console.log('Nenhuma regra encontrada.');
            return interaction.reply({ content: 'Não há regras registradas.', ephemeral: true });
          }
      
          const embed = new EmbedBuilder()
            .setTitle('Regras do Servidor (com IDs)')
            .setColor(0x0099ff)
            .setTimestamp();
      
          let regrasList = '';
          rows.forEach((row) => {
            regrasList += `**ID:** ${row.id}\n**Tipo:** ${row.tipo}\n**Pontos:** ${row.pontos}\n**Descrição:** ${row.descricao}\n\n`;
          });
      
          embed.setDescription(regrasList);
      
          // Envia a resposta como 'ephemeral' para que apenas o usuário que enviou o comando veja
          interaction.reply({ embeds: [embed], ephemeral: true });
        });
      }else if (subcommand === 'ver') {
        console.log('Exibindo regras ganhas/perdidas');
        
        db.all('SELECT tipo, pontos, descricao FROM regras', [], (err, rows) => {
          if (err) {
            console.error('Erro ao carregar as regras:', err.message);
            return interaction.reply({ content: 'Houve um erro ao carregar as regras.', ephemeral: true });
          }
      
          if (rows.length === 0) {
            console.log('Nenhuma regra encontrada.');
            return interaction.reply({ content: 'Não há regras registradas.', ephemeral: true });
          }
      
          const embed = new EmbedBuilder()
            .setTitle('Regras para Ganhar e Perder Pontos')
            .setColor(0x0099ff)
            .setTimestamp();
      
          let ganharPontos = '';
          let perderPontos = '';
      
          rows.forEach((row) => {
            if (row.tipo === 'ganhar') {
              ganharPontos += `${row.descricao} (+${row.pontos} pontos)\n`;
            } else if (row.tipo === 'perder') {
              perderPontos += `${row.descricao} (-${row.pontos} pontos)\n`;
            }
          });
      
          if (ganharPontos) {
            embed.addFields({ name: 'Ganhar pontos', value: ganharPontos });
          } else {
            embed.addFields({ name: 'Ganhar pontos', value: 'Sem regras de ganho de pontos.' });
          }
      
          if (perderPontos) {
            embed.addFields({ name: 'Perder pontos', value: perderPontos });
          } else {
            embed.addFields({ name: 'Perder pontos', value: 'Sem regras de perda de pontos.' });
          }
      
          // Envia a resposta como 'ephemeral' para que apenas o usuário que enviou o comando veja
          interaction.reply({ embeds: [embed], ephemeral: true });
        });
      }
      
  },
};
