import { world, system } from "@minecraft/server";
// Test
const spikeLaggingData = new Map();

function calculateDistance(loc1, loc2) {
    const dx = loc1.x - loc2.x;
    const dy = loc1.y - loc2.y;
    const dz = loc1.z - loc2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function updateSpikeLaggingData() {
    const players = world.getAllPlayers();
    for (const player of players) {
        const sl = spikeLaggingData.get(player.id) ?? {
            lastLocation: player.location,
            ping: 0,
            isSpikeLagging: false,
        };
        
        const v = player.getVelocity();
        const velocity = Math.hypot(v.x, v.z);
        const distance = calculateDistance(sl.lastLocation, player.location);
        
        let tickPing = Math.abs(1000 - (velocity * 1000) / distance);
        if (!isFinite(tickPing) || isNaN(tickPing)) tickPing = 999;
        
        sl.ping = +tickPing;
        sl.lastLocation = player.location;
        spikeLaggingData.set(player.id, sl);
    }
}

function updateSpikeLaggingStatus() {
    const players = world.getAllPlayers();
    for (const player of players) {
        const sl = spikeLaggingData.get(player.id);
        if (!sl) continue;
        
        sl.isSpikeLagging = Math.trunc(sl.ping / 20) >= 850;
        spikeLaggingData.set(player.id, sl);
    }
}

function isSpikeLagging(player) {
    return spikeLaggingData.get(player.id)?.isSpikeLagging ?? false;
}

// Update spike lagging data every tick
system.runInterval(updateSpikeLaggingData, 1);

// Update spike lagging status every second
system.runInterval(updateSpikeLaggingStatus, 20);

const pingData = new Map();

async function estimatePing(player) {
    const now = Date.now();
    const data = pingData.get(player.id) || { lastPing: 0, pings: [] };
    
    if (now - data.lastPing >= 1000) {  // Measure every second
        const start = Date.now();
        try {
            await player.runCommandAsync("testfor @s");
            const end = Date.now();
            const ping = end - start;
            
            data.pings.push(ping);
            if (data.pings.length > 5) data.pings.shift();
            data.lastPing = now;
            
            pingData.set(player.id, data);
        } catch (error) {
            console.warn(`Error estimating ping for ${player.name}: ${error}`);
        }
    }
}

world.afterEvents.playerSpawn.subscribe(({ player }) => {
    // Reset ping data when player spawns
    pingData.set(player.id, { lastPing: 0, pings: [] });
});

system.runInterval(() => world.getAllPlayers().forEach(estimatePing), 2);

system.runInterval(() => {
const player = world.getAllPlayers()[0]
const lagging = isSpikeLagging(player);
        //console.warn(`Player ${player.name}: Spike Lagging = ${lagging}`);
        const data = pingData.get(player.id);
        if (data && data.pings.length > 0) {
            const avgPing = Math.round(data.pings.reduce((a, b) => a + b, 0) / data.pings.length);
            player.sendMessage(`Your estimated ping is ${avgPing}ms`);
        } else {
            player.sendMessage("Ping data not available yet. Please wait a moment and try again.");
        }
}, 40)

world.beforeEvents.chatSend.subscribe((event) => {
    const { sender: player, message } = event;
    if (message.toLowerCase() === "!ping") {
        const data = pingData.get(player.id);
        if (data && data.pings.length > 0) {
            const avgPing = Math.round(data.pings.reduce((a, b) => a + b, 0) / data.pings.length);
            player.sendMessage(`Your estimated ping is ${avgPing}ms`);
        } else {
            player.sendMessage("Ping data not available yet. Please wait a moment and try again.");
        }
        event.cancel = true;
    }
});

world.afterEvents.playerLeave.subscribe((event) => {
    pingData.delete(event.playerId);
});
