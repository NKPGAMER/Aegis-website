import { world } from '@minecraft/server';
import keyword from './keyword';
import featureKeywords from './featureKeywords';

class AegisAssistant {
    constructor() {
        this.isActive = false;
        this.functions = {};
    }

    activate() {
        this.isActive = true;
        world.sendMessage("Aegis đã được kích hoạt.");
    }

    deactivate() {
        this.isActive = false;
        world.sendMessage("Aegis đã được tắt.");
    }

    handleMessage(message, player) {
        if (!this.isActive && message.toLowerCase().includes("aegis")) {
            this.activate();
            return;
        }

        if (this.isActive) {
            if (message.toLowerCase().includes("dừng") || message.toLowerCase().includes("thoát aegis")) {
                this.deactivate();
                return;
            }

            const intent = this.determineIntent(message);
            if (intent && this.functions[intent.key]) {
                const response = this.functions[intent.key].run(intent.params, player);
                player.sendMessage(this.getRandomResponse(this.functions[intent.key].responses));
                player.sendMessage(response);
            }
        }
    }

    determineIntent(message) {
        for (const [keyword, key] of Object.entries(keyword)) {
            if (message.toLowerCase().includes(keyword)) {
                const params = this.extractParams(message, key);
                return { key, params };
            }
        }
        return null;
    }

    extractParams(message, key) {
        if (key === "time") {
            if (message.includes("sáng")) return ["day"];
            if (message.includes("đêm")) return ["night"];
        }
        if (key === "weather") {
            if (message.includes("mưa")) return ["rain"];
            if (message.includes("nắng")) return ["clear"];
        }
        if (key === "distance") {
            const match = message.match(/(@\w+|[\w]+)/);
            if (match) return [match[0]];
        }
        return [];
    }

    getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }

    subscribe(key, responses, run) {
        this.functions[key] = { responses, run };
    }

    calculateDistance(loc1, loc2) {
        const dx = loc1.x - loc2.x;
        const dy = loc1.y - loc2.y;
        const dz = loc1.z - loc2.z;
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }
}

const aegis = new AegisAssistant();

world.beforeEvents.chatSend.subscribe((eventData) => {
  if (eventData.message.includes('aegis')) {
  
  }
    aegis.handleMessage(eventData.message, eventData.sender);
});

// Đăng ký các chức năng
aegis.subscribe("time", 
    ["Đã thay đổi thời gian.", "Thời gian đã được cập nhật."],
    (params) => {
        const time = params[0] || "day";
        world.getDimension("overworld").runCommandAsync(`time set ${time}`);
        return `Đã đặt thời gian thành ${time}`;
    }
);

aegis.subscribe("weather", 
    ["Thời tiết đã thay đổi.", "Đã cập nhật thời tiết."],
    (params) => {
        const weather = params[0] || "clear";
        world.getDimension("overworld").runCommand(`weather ${weather}`);
        return `Đã đặt thời tiết thành ${weather}`;
    }
);

aegis.subscribe("distance", 
    ["Đang tính toán khoảng cách...", "Để tôi kiểm tra khoảng cách cho bạn."],
    (params, player) => {
        if (params.length === 0) return "Không tìm thấy tên người chơi trong yêu cầu.";
        
        const targetPlayerName = params[0].replace("@", "");
        const targetPlayer = [...world.getPlayers()].find(p => p.name.toLowerCase() === targetPlayerName.toLowerCase());
        
        if (!targetPlayer) return `Không tìm thấy người chơi ${targetPlayerName}.`;
        
        const distance = aegis.calculateDistance(player.location, targetPlayer.location);
        return `Khoảng cách đến ${targetPlayer.name} là ${distance.toFixed(2)} block.`;
    }
);

// Lắng nghe sự kiện chat
