import { Providers } from "@arkecosystem/core-kernel";
import Rollbar from "rollbar";

export class ServiceProvider extends Providers.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.ioc.bind("errorTracker").toConstantValue(new Rollbar(this.config().all()));
    }
}
