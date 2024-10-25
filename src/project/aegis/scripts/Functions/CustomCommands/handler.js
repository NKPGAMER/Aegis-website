import { world } from "@minecraft/server";

const prefix = "!";
const commands = new Map();

function subscribe(object, func) {
    commands.set(object.key, { ...object, func });
}

function parseArgs(message) {
    const args = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let char of message) {
        if ((char === "'" || char === '"' || char === '`') && (!inQuotes || char === quoteChar)) {
            inQuotes = !inQuotes;
            quoteChar = inQuotes ? char : '';
        } else if (char === ' ' && !inQuotes) {
            if (current) {
                args.push(current);
                current = '';
            }
        } else {
            current += char;
        }
    }

    if (current) {
        args.push(current);
    }

    return args;
}

function hasPermission(player, permission) {
    return permission.every(tag => player.hasTag(tag));
}

world.beforeEvents.chatSend.subscribe((eventData) => {
    if (eventData.message.startsWith(prefix)) {
        eventData.cancel = true;
        const player = eventData.sender;
        const args = parseArgs(eventData.message.slice(prefix.length));
        const commandName = args?.shift()?.toLowerCase() || "";

        if (commands.has(commandName)) {
            const command = commands.get(commandName);
            if (hasPermission(player, command.permission)) {
                command.func(player, args);
            } else {
                player.sendMessage("§cYou don't have permission to use this command.");
            }
        } else {
            player.sendMessage("§cUnknown command. Type !help for a list of commands.");
        }
    }
});

// Help command
subscribe({
    key: "help",
    description: "Displays available commands or details of a specific command",
    usage: "!help [command]",
    permission: []
}, (player, args) => {
    if (args.length === 0) {
        const availableCommands = Array.from(commands.values())
            .filter(cmd => hasPermission(player, cmd.permission))
            .map(cmd => cmd.key)
            .join(", ");
        player.sendMessage(`§aAvailable commands: ${availableCommands}`);
        player.sendMessage("§aUse !help <command> for more details on a specific command.");
    } else {
        const commandName = args[0].toLowerCase();
        if (commands.has(commandName)) {
            const command = commands.get(commandName);
            if (hasPermission(player, command.permission)) {
                player.sendMessage(`§6Command: §f${command.key}`);
                player.sendMessage(`§6Description: §f${command.description}`);
                player.sendMessage(`§6Usage: §f${command.usage}`);
            } else {
                player.sendMessage("§cYou don't have permission to view this command.");
            }
        } else {
            player.sendMessage("§cUnknown command. Type !help for a list of commands.");
        }
    }
});

// Example command
subscribe({
    key: "hello",
    description: "Greets the player",
    usage: "!hello [name]",
    permission: []
}, (player, args) => {
    const name = args.length > 0 ? args[0] : player.name;
    player.sendMessage(`§aHello, ${name}!`);
});

export { prefix, commands, subscribe };