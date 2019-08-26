import { Contracts, Providers } from "@arkecosystem/core-kernel";
import { EventListener } from "./event-listener";
import { NetworkMonitor } from "./network-monitor";
import { PeerCommunicator } from "./peer-communicator";
import { PeerConnector } from "./peer-connector";
import { PeerProcessor } from "./peer-processor";
import { PeerService } from "./peer-service";
import { PeerStorage } from "./peer-storage";
import { startSocketServer } from "./socket-server";

export class ServiceProvider extends Providers.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.ioc.bind("p2p.options").toConstantValue(this.config().all());

        this.ioc.get<Contracts.Kernel.Log.ILogger>("log").info("Starting P2P Interface");

        const service: Contracts.P2P.IPeerService = this.makePeerService(this.config().all());

        // tslint:disable-next-line: no-unused-expression
        new EventListener(service);

        if (!process.env.DISABLE_P2P_SERVER) {
            service.getMonitor().setServer(await startSocketServer(service, this.config().all()));
        }

        this.ioc.bind("p2p").toConstantValue(service);
    }

    public async dispose(): Promise<void> {
        this.ioc.get<Contracts.Kernel.Log.ILogger>("log").info("Stopping P2P Interface");

        this.ioc
            .get<Contracts.P2P.IPeerService>("p2p")
            .getMonitor()
            .stopServer();
    }

    public async required(): Promise<boolean> {
        return true;
    }

    // @todo: ioc
    private makePeerService(options): PeerService {
        const storage = new PeerStorage();
        const connector = new PeerConnector();

        const communicator = new PeerCommunicator(connector);
        const processor = new PeerProcessor({ storage, connector, communicator });
        const monitor = new NetworkMonitor({ storage, processor, communicator, options });

        return new PeerService({ storage, processor, connector, communicator, monitor });
    }
}
