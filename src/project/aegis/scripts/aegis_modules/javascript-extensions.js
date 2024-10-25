/**
 * @author NKPGAMER
 */

/*
 * Array
 */

if (!Array.prototype.includesObject) {
  Array.prototype.includesObject = function (value) { return this.some((element) => Object.keys(value).every((key) => element[key] === value[key])); };
}

if (!Array.prototype.delete) {
  Array.prototype.delete = function (index) {
    if (index > -1) {
      this.splice(index, 1);
    }
  };
}

/*
 * Console
 */
const Logs = [];
const { log, warn, error, info } = console;

const timeLabels = {};
if (!console.time) {
  console.time = (label = 'default') => {
    if (typeof label != 'string') throw new TypeError("label must be a string");
    timeLabels[label] = Date.now();
  };
}

if (!console.timeEnd) {
  console.timeEnd = (label = 'default') => {
    if (typeof label != 'string') throw new TypeError("label must be a string");
    if (timeLabels[label]) {
      const duration = Date.now() - timeLabels[label];
      console.warn(`${label}: ${duration.toFixed(2)}ms`);
      delete timeLabels[label];
    } else throw new Error(`No such label: ${label}`);
  };
}

const createLogMethod = (type, originalMethod) => (...msg) => {
  Logs.push({ type, message: msg.join("\n") });
  originalMethod.apply(console, msg);
};

Object.defineProperties(console, {
  log: { value: createLogMethod("log", log) },
  warn: { value: createLogMethod("warn", warn) },
  error: { value: createLogMethod("error", error) },
  info: { value: createLogMethod("info", info) },
  getLogs: { value: () => Logs }
});

/*
 * Date
 */

if (!Date.prototype.isLeapYear) {
  Date.prototype.isLeapYear = function () {
    const year = this.getFullYear();
    return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
  };
}

if (!Date.prototype.addDay) {
  Date.prototype.addDay = function (value) {
    if (typeof value != 'number') throw new TypeError();
    this.setDate(this.getDate() + value);
  };
}

if (!Date.prototype.addHours) {
  Date.prototype.addHours = function (value) {
    if (typeof value != 'number') throw new TypeError();
    this.setHours(this.getHours() + value);
    return this;
  };
}

if (!Date.prototype.addMilliseconds) {
  Date.prototype.addMilliseconds = function (value) {
    if (typeof value != 'number') throw new TypeError();
    this.setMilliseconds(this.getMilliseconds() + value);
  };
}

if (!Date.prototype.addMinutes) {
  Date.prototype.addMinutes = function (value) {
    if (typeof value != 'number') throw new TypeError();
    this.setMinutes(this.getMinutes() + value);
    return this;
  };
}

if (!Date.prototype.addMonths) {
  Date.prototype.addMonths = function (value) {
    if (typeof value != 'number') throw new TypeError();
    this.setMonth(this.getMonth() + value);
    return this;
  };
}

if (!Date.prototype.addSeconds) {
  Date.prototype.addSeconds = function (value) {
    if (typeof value != 'number') throw new TypeError();
    this.setSeconds(this.getSeconds() + value);
    return this;
  };
}

if (!Date.prototype.addYears) {
  Date.prototype.addYears = function (value) {
    if (typeof value != 'number') throw new TypeError();
    this.setFullYear(this.getFullYear() + value);
    return this;
  };
}

/*
 * Error
 */
if (!Error.prototype.toString) {
  Error.prototype.toString = function () {
    const label = this.class
      ? this.function
        ? `[${this.class}::${this.function}]`
        : `[Class:${this.class}]`
      : this.function
        ? `[Function:${this.function}]`
        : `[Error]`;

    return `${label}: ${this.message.trim()} ${this.stack.trim()}`;
  };
}

/*
 * Map
 */
Object.defineProperties(Map.prototype, {
  merge: {
    value: function (map, replaceExisting) {
      const mergedMap = new Map([...this]);
      for (const [key, value] of map) {
        if (!replaceExisting && mergedMap.has(key)) continue;
        mergedMap.set(key, value);
      }
      return mergedMap;
    }
  },
  find: {
    value: function (callback) {
      for (const [key, value] of this) {
        if (callback(value, key, this)) {
          return value;
        }
      }
      return undefined;
    }
  },
  deleteKeyRegex: {
    value: function (regex) {
      this.forEach((value, key) => {
        if (key.match(regex)) this.delete(key);
      });
    }
  },
  shift: {
    value: (function () {
      const firstKey = this.keys().next().value;
      const firstValue = this.get(firstKey);
      this.delete(firstKey);

      return [firstKey, firstValue];
    })
  }
});


/*
 * Math
 */
const { hypot, max, min } = Math;

if (!Math.randomInt) {
  Math.randomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
}

if (!Math.average) {
  Math.average = function (numbers) {
    if (!Array.isArray(numbers) || !numbers.length) return;

    return numbers.reduce((sum, num) => sum + (typeof num === 'number' ? num : 0), 0) / numbers.length;
  };
}

if (!Math.tickToSecond) {
  Math.tickToSecond = function (ticks) {
    return ticks / 20;
  };
}

if (!Math.secondToTick) {
  Math.secondToTick = function (seconds) {
    return seconds * 20;
  };
}

if (!Math.distanceVector3) {
  Math.distanceVector3 = (pos1, pos2) => {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };
}

if (!Math.distanceVector2) {
  Math.distanceVector2 = (pos1, pos2) => {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dz * dz);
  };
}

if (!Math.isInRange) {
  Math.isInRange = ({ x, y, z }, { location1, location2 }) => {
    const [xMin, xMax] = [min(location1.x, location2.x), max(location1.x, location2.x)];
    const [yMin, yMax] = [min(location1.y, location2.y), max(location1.y, location2.y)];
    const [zMin, zMax] = [min(location1.z, location2.z), max(location1.z, location2.z)];
    return x >= xMin && x <= xMax && y >= yMin && y <= yMax && z >= zMin && z <= zMax;
  };
}

if (!Math.autoFloor) {
  Math.autoFloor = (value) => {
    if (Array.isArray(value)) {
      return value.filter(i => typeof i === 'number').map(Math.floor);
    }

    if (typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, Math.floor(v)]));
    }

    throw new TypeError("Parameters must be a Array<number> or Object<number>");
  };
}

/*
 * Number
 */

if (!Number.prototype.ticksToSeconds) {
  Number.prototype.ticksToSeconds = function () { return this / 20; };
}

if (!Number.prototype.secondsToTicks) {
  Number.prototype.secondsToTicks = function () { return this * 20; };
}

/*
 * Object
 */
if (!Object.prototype.equal) {
  Object.prototype.equal = function (obj) {
    if (!(obj instanceof Object)) return false;
    const props1 = Object.getOwnPropertyNames(this);
    const props2 = Object.getOwnPropertyNames(obj);
    if (props1.length !== props2.length) return false;

    return props1.every(propName => this[propName] === obj[propName]);
  };
}
/*
 * String
 */

if (!String.randomColor) {
  String.randomColor = function (str, colors = []) {
    if (typeof str != 'string' || !Array.isArray(colors) || colors.length == 0) return str;
    return this.replace(/§./g, "").split('').map(w => colors[Math.floor(Math.random() * colors.length) || w]).join('');
  };
}

if (!String.isJSON) {
  String.isJSON = function (str) {
    try {
      JSON.parse(str);
      return false;
    } catch {
      return true;
    }
  };
}

if (!String.hexToEmoji) {
  String.hexToEmoji = function (str) {
    const num = parseInt(str, 16);
    if (isNaN(num) || num < 57344 || num > 63743) return "?";
    return String.fromCharCode(num);
  };
}

if (!String.generateRandomString) {
  String.generateRandomString = function (length, allowUpperCase = true, allowNumbers = true, allowSpecialChars = true) {
    let chars = "abcdefghijklmnopqrstuvwxyz";
    if (allowNumbers) chars += "0123456789";
    if (allowUpperCase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (allowSpecialChars) chars += "!@#$%^&*()_+-=[]{};:'\"\\|,./<>?";
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };
}

if (!String.generateUUID) {
  String.generateUUID = function () {
    const randomPart = Math.random().toString(16).slice(2);
    const timePart = Date.now().toString(16);
    return `${timePart}-${randomPart}-4${randomPart.slice(0, 3)}-9${randomPart.slice(3, 6)}-${randomPart.slice(6, 12)}`;
  };
}

if (!String.toRegex) {
  String.toRegex = function (str) {
    const regexPattern = /^\/(.*?)\/([gimsuy]*)$/;
    const match = regexString.match(regexPattern);

    if (!match) throw new Error("Invalid regex string format");
    const [_, pattern, flags] = match;
    return new RegExp(pattern, flags);
  };
}