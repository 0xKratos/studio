import { Inject } from '@nestjs/common';

import { Register } from '~app-toolkit/decorators';
import { PositionBalanceFetcher } from '~position/position-balance-fetcher.interface';
import { AppTokenPositionBalance } from '~position/position-balance.interface';
import { Network } from '~types/network.interface';

import { SynthetixSynthTokenBalanceHelper } from '../helpers/synthetix.synth.token-balance-helper';
import { SYNTHETIX_DEFINITION } from '../synthetix.definition';

@Register.TokenPositionBalanceFetcher({
  appId: SYNTHETIX_DEFINITION.id,
  groupId: SYNTHETIX_DEFINITION.groups.synth.id,
  network: Network.ETHEREUM_MAINNET,
})
export class EthereumSynthetixSynthTokenBalanceFetcher implements PositionBalanceFetcher<AppTokenPositionBalance> {
  constructor(
    @Inject(SynthetixSynthTokenBalanceHelper)
    private readonly tokenBalanceHelper: SynthetixSynthTokenBalanceHelper,
  ) {}

  async getBalances(address: string) {
    return this.tokenBalanceHelper.getBalances({
      address,
      network: Network.ETHEREUM_MAINNET,
      resolverAddress: '0x823be81bbf96bec0e25ca13170f5aacb5b79ba83',
    });
  }
}
