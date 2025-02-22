import { Register } from '~app-toolkit/decorators';
import { PositionBalanceFetcher } from '~position/position-balance-fetcher.interface';
import { AppTokenPositionBalance } from '~position/position-balance.interface';
import { Network } from '~types/network.interface';

import LIDO_DEFINITION from '../lido.definition';

@Register.TokenPositionBalanceFetcher({
  appId: LIDO_DEFINITION.id,
  groupId: LIDO_DEFINITION.groups.wsteth.id,
  network: Network.ETHEREUM_MAINNET,
})
export class EthereumLidoWstethTokenBalanceFetcher implements PositionBalanceFetcher<AppTokenPositionBalance> {
  async getBalances(_address: string) {
    // Already counted in base tokens, remove double count
    return [];
  }
}
