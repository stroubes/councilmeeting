"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PostgresService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresService = exports.DatabaseUnavailableError = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const pg_1 = require("pg");
class DatabaseUnavailableError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DatabaseUnavailableError';
    }
}
exports.DatabaseUnavailableError = DatabaseUnavailableError;
let PostgresService = PostgresService_1 = class PostgresService {
    configService;
    logger = new common_1.Logger(PostgresService_1.name);
    pool;
    isAvailable = true;
    constructor(configService) {
        this.configService = configService;
        const databaseUrl = this.configService.get('databaseUrl') ?? process.env.DATABASE_URL;
        this.pool = databaseUrl ? new pg_1.Pool({ connectionString: databaseUrl }) : null;
        if (!this.pool) {
            this.logger.warn('DATABASE_URL is not configured. Falling back to in-memory repositories.');
        }
    }
    get isEnabled() {
        return this.pool !== null && this.isAvailable;
    }
    async query(sql, params = []) {
        if (!this.pool || !this.isAvailable) {
            throw new DatabaseUnavailableError('Database is not configured or currently unavailable.');
        }
        try {
            return await this.pool.query(sql, params);
        }
        catch (error) {
            this.isAvailable = false;
            const message = error instanceof Error ? error.message : 'Unknown database error';
            this.logger.warn(`Database unavailable, switching to in-memory mode: ${message}`);
            throw new DatabaseUnavailableError(message);
        }
    }
    async onModuleDestroy() {
        if (this.pool) {
            await this.pool.end();
        }
    }
};
exports.PostgresService = PostgresService;
exports.PostgresService = PostgresService = PostgresService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PostgresService);
//# sourceMappingURL=postgres.service.js.map