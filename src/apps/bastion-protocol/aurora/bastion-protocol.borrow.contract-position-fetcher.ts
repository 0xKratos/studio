import { Inject } from '@nestjs/common';
import { isNumber } from 'lodash';

import { APP_TOOLKIT, IAppToolkit } from '~app-toolkit/app-toolkit.interface';
import { Register } from '~app-toolkit/decorators';
import { buildDollarDisplayItem, buildPercentageDisplayItem } from '~app-toolkit/helpers/presentation/display-item.present';
import { getLabelFromToken } from '~app-toolkit/helpers/presentation/image.present';
import { ContractType } from '~position/contract.interface';
import { PositionFetcher } from '~position/position-fetcher.interface';
import { ContractPosition } from '~position/position.interface';
import { borrowed } from '~position/position.utils';
import { Network } from '~types/network.interface';

import { BASTION_PROTOCOL_DEFINITION } from '../bastion-protocol.definition';
import { BastionProtocolContractFactory } from '../contracts';
import { BastionSupplyTokenDataProps } from '../helper/bastion-protocol.supply.token-helper';

const appId = BASTION_PROTOCOL_DEFINITION.id;
const groupId = BASTION_PROTOCOL_DEFINITION.groups.borrow.id;
const network = Network.AURORA_MAINNET;

@Register.ContractPositionFetcher({ appId, groupId, network })
export class AuroraBastionProtocolBorrowContractPositionFetcher implements PositionFetcher<ContractPosition> {
  constructor(
    @Inject(APP_TOOLKIT) private readonly appToolkit: IAppToolkit,
    @Inject(BastionProtocolContractFactory)
    private readonly bastionProtocolContractFactory: BastionProtocolContractFactory,
  ) { }

  async getPositions() {
    const appTokens = await this.appToolkit.getAppTokenPositions<BastionSupplyTokenDataProps>({
      appId,
      groupIds: [
        BASTION_PROTOCOL_DEFINITION.groups.supply.id,
      ],
      network,
    });

    const multicall = this.appToolkit.getMulticall(network);
    const promisedPositions = appTokens.map(async appToken => {
      const contract = this.bastionProtocolContractFactory.bastionProtocolCtoken({ network, address: appToken.address });

      // Get the cash reserves of the market. Cash reserves are the underlying assets that are available to borrow
      const cashRaw = await multicall.wrap(contract).getCash();
      const cashSupply = Number(cashRaw) / 10 ** appToken.tokens[0].decimals;

      const tokens = [borrowed(appToken.tokens[0])];
      // The underlying token liquidity actually represents the TOTAL SUPPLY of a borrowed
      // contract position, not the liquidity. This includes assets that have been borrowed and that are available to borrow.
      // Denominated in USD
      const underlyingLiquidity = appToken.dataProps.liquidity;
      const underlyingPrice = appToken.tokens[0].price;
      // We denominate the cashSupply in USD to be consistent with the underlyingLiquidity
      const cashSupplyUSD = cashSupply * underlyingPrice;
      const borrowLiquidity = underlyingLiquidity - cashSupplyUSD;

      const dataProps = {
        ...appToken.dataProps,
        liquidity: -borrowLiquidity,
        supply: underlyingLiquidity,
        // The amount borrowed can be derived simply by substracting the liquidity from the total supply
        // of tokens
        borrow: borrowLiquidity,
      };
      const borrowApy = appToken.dataProps.borrowApy;

      // Display Props
      const label = `Borrowed ${getLabelFromToken(appToken.tokens[0])}`;
      const secondaryLabel = buildDollarDisplayItem(underlyingPrice);
      const tertiaryLabel = isNumber(borrowApy) ? `${(borrowApy * 100).toFixed(3)}% APR` : '';
      const images = appToken.displayProps.images;
      const statsItems = isNumber(borrowApy)
        ? [
          { label: 'Borrow APR', value: buildPercentageDisplayItem(borrowApy) },
          { label: 'Liquidity', value: buildDollarDisplayItem(dataProps.liquidity) },
        ]
        : [];

      const contractPosition: ContractPosition<BastionSupplyTokenDataProps> = {
        type: ContractType.POSITION,
        address: appToken.address,
        network,
        appId,
        groupId,
        tokens,
        dataProps,
        displayProps: {
          label,
          secondaryLabel,
          tertiaryLabel,
          images,
          statsItems,
        },
      };

      return contractPosition;
    });

    const positions = await Promise.all(promisedPositions);

    return positions;
  }
}
