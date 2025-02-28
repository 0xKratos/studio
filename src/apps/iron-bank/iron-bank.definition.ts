import { Register } from '~app-toolkit/decorators';
import { appDefinition, AppDefinition } from '~app/app.definition';
import { AppAction, AppTag, GroupType } from '~app/app.interface';
import { Network } from '~types/network.interface';

export const IRON_BANK_DEFINITION = appDefinition({
  id: 'iron-bank',
  name: 'Iron Bank',
  description: 'iron',
  url: 'https://app.ib.xyz/',
  groups: {
    supply: { id: 'supply', type: GroupType.TOKEN, label: 'Supply' },
    borrow: { id: 'borrow', type: GroupType.POSITION, label: 'Borrow' },
  },
  tags: [AppTag.LENDING],
  keywords: [],
  links: {},

  supportedNetworks: {
    [Network.ETHEREUM_MAINNET]: [AppAction.VIEW],
    [Network.FANTOM_OPERA_MAINNET]: [AppAction.VIEW],
    [Network.AVALANCHE_MAINNET]: [AppAction.VIEW],
  },

  primaryColor: '#fff',
});

@Register.AppDefinition(IRON_BANK_DEFINITION.id)
export class IronBankAppDefinition extends AppDefinition {
  constructor() {
    super(IRON_BANK_DEFINITION);
  }
}

export default IRON_BANK_DEFINITION;
