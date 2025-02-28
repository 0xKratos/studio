import { Inject } from '@nestjs/common';
import { sumBy } from 'lodash';

import { IAppToolkit, APP_TOOLKIT } from '~app-toolkit/app-toolkit.interface';
import { Register } from '~app-toolkit/decorators';
import { TvlFetcher } from '~stats/tvl/tvl-fetcher.interface';
import { Network } from '~types/network.interface';

import { STURDY_DEFINITION } from '../sturdy.definition';

const appId = STURDY_DEFINITION.id;
const network = Network.ETHEREUM_MAINNET;

@Register.TvlFetcher({ appId, network })
export class EthereumSturdyTvlFetcher implements TvlFetcher {
  constructor(@Inject(APP_TOOLKIT) private readonly appToolkit: IAppToolkit) {}

  async getTvl() {
    const lendingTokens = await this.appToolkit.getAppTokenPositions({
      appId,
      groupIds: [STURDY_DEFINITION.groups.supply.id],
      network,
    });
    return sumBy(lendingTokens, v => v.supply * v.price);
  }
}
