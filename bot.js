const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { token, clientId, guildId } = require('./config.json');  // Certifique-se de criar o arquivo config.json com o token, clientId e guildId do seu bot
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates] }); // Adicionei mais intents para trabalhar com voz e membros

// Carregar comandos dinamicamente da pasta 'comandos'
const comandosPath = path.join(__dirname, 'comandos');
const comandosFiles = fs.readdirSync(comandosPath).filter(file => file.endsWith('.js'));

// Registrar comandos na guilda (faça isso apenas uma vez ou quando necessário)
const rest = new REST({ version: '10' }).setToken(token);

const registerCommands = async () => {
  try {
    console.log('Registrando comandos no servidor...');

    const commands = [];
    for (const file of comandosFiles) {
      const command = require(`./comandos/${file}`).data;
      commands.push(command);
    }

    // Registrar os comandos na guilda específica
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    }).then(() => {
      console.log('Comandos registrados com sucesso!');
    }).catch((error) => {
      console.error('Erro ao registrar os comandos:', error);
    });

  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
  }
};

// Chame isso apenas quando você precisar registrar os comandos, não a cada inicialização do bot
registerCommands();

// Quando o bot estiver pronto
client.once('ready', () => {
  console.log('Bot está online!');
});

// Quando uma interação for criada
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
  
    const { commandName } = interaction;
  
    try {
      // Verificar se o comando existe
      const comandoArquivo = require(`./comandos/${commandName}.js`);
      
      // Verificar se há subcomando
      if (interaction.options.getSubcommand) {
        // Se houver subcomando, pegá-lo
        const subcommand = interaction.options.getSubcommand();
        await comandoArquivo.execute(interaction, subcommand, client);
      } else {
        // Caso não haja subcomando, apenas executar o comando
        await comandoArquivo.execute(interaction, null, client);  // Passa null para o subcomando
      }
    } catch (error) {
      console.error('Erro ao executar o comando:', error);
      interaction.reply({ content: 'Houve um erro ao executar o comando.', ephemeral: true });
    }
  });
  
// Loga o bot com o token
client.login(token);
