const { EmbedBuilder } = require('discord.js');  // Importando o EmbedBuilder
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('comando')
    .setDescription('Exibe a lista de comandos ou detalhes específicos sobre os comandos.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('ver')
        .setDescription('Exibe a lista de comandos do bot.')
    ),
  
  execute: async (interaction) => {
    // Verifique qual subcomando foi usado
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'ver') {
      const embed = new EmbedBuilder()
        .setTitle('Lista de Comandos do Bot')
        .setColor(0x0099ff)
        .setDescription('Aqui estão todos os comandos que você pode usar:')
        .addFields(
          { name: '/comandos', value: 'Exibe esta lista de comandos.' },
          { name: '/pontos adicionar', value: 'Adiciona pontos a um usuário. \n**Exemplo**: `/pontos adicionar @usuario quantidade:10 motivo:"Motivação"`' },
          { name: '/pontos remover', value: 'Remove pontos de um usuário. \n**Exemplo**: `/pontos remover @usuario quantidade:5 motivo:"Motivação"`' },
          { name: '/pontos ver', value: 'Exibe os pontos de todos os usuários registrados.' },
          { name: '/notificação adicionar', value: 'Adiciona um canal para receber notificações. \n**Exemplo**: `/notificação adicionar #canal`' },
          { name: '/notificação remover', value: 'Remove um canal das notificações. \n**Exemplo**: `/notificação remover #canal`' },
          { name: '/notificação mostrar', value: 'Exibe todos os canais registrados para notificações.' },
          { name: '/cargos registrar', value: 'Registra um cargo com intervalo de pontos. \n**Exemplo**: `/cargos registrar @cargo minimo:10 maximo:20`' },
          { name: '/cargos remover', value: 'Remove um cargo registrado. \n**Exemplo**: `/cargos remover @cargo`' },
          { name: '/cargos ver', value: 'Exibe todos os cargos registrados com seus intervalos de pontos.' },
          { name: '/regras adicionar', value: 'Adiciona uma nova regra ao banco de dados. \n**Exemplo**: `/regras adicionar tipo:"ganhar" pontos:10 descricao:"Recompensa por bom comportamento"`' },
          { name: '/regras remover', value: 'Remove uma regra existente pelo ID. \n**Exemplo**: `/regras remover id:1`' },
          { name: '/regras ver', value: 'Exibe todas as regras cadastradas no sistema.' },
          { name: '/regras id', value: 'Exibe todas as regras com seus IDs. \n**Exemplo**: `/regras id`' },
        )
        .setTimestamp();

      // Enviar a embed apenas para o usuário que enviou o comando (ephemeral: true)
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
