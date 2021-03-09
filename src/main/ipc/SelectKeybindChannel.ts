import IpcChannelInterface from 'main/ipc/IpcChannelInterface';

import { IpcMainEvent } from 'electron';
import IpcRequest from 'shared/types/IpcRequest';

import { Keybind } from 'shared/types/Keybind';

import KeybindModel from 'main/models/KeybindModel';

export default class SelectKeybindChannel implements IpcChannelInterface {
  public getName() {
    return 'select-keybind';
  }

  public async handle(event: IpcMainEvent, request: IpcRequest) {
    if (!request.responseChannel) {
      request.responseChannel = `${this.getName()}_response`;
    }

    const model = KeybindModel.init();
    let keybinds = model.list;

    if (!keybinds) {
      keybinds = [];
    }

    const name = request.params.name as string;
    const keys = request.params.keys as string[];
    const address = request.params.address as string;

    if (keys) {
      if (this.validateKeybind(keybinds, { name, keys})) {
        keybinds = this.removeExistingKeybind(keybinds, address);

        keybinds.push({
          name,
          keys,
          devices: [
            address,
          ],
        });
      }
    } else {
      keybinds = this.removeExistingKeybind(keybinds, address);

      for (let i = 0; i < keybinds.length; i++) {
        const keybind = keybinds[i];

        if (keybind.name === name) {
          keybinds[i].devices.push(address);
        }
      }
    }

    model.list = keybinds;

    event.sender.send(request.responseChannel, keybinds);
  }

  private validateKeybind(keybinds: Keybind[], { name, keys }: any) {
    for (const keybind of keybinds) {
      if (keybind.name === name || keybind.keys.toString() === keys.toString()) {
        return false;
      }
    }

    return true;
  }

  private removeExistingKeybind(keybinds: Keybind[], address: string) {
    for (let i = 0; i < keybinds.length; i++) {
      const keybind = keybinds[i];

      if (keybind.devices.includes(address)) {
        console.log('sw');
        if (keybind.devices.length === 1) {
          keybinds = keybinds.filter((value, index) => index !== i);
        } else {
          keybinds[i].devices = keybinds[i].devices.filter((value) => address !== value);
        }
      }
    }

    return keybinds;
  }
}
