export type ConfigMasterCode = string;
export type DelFlag = 'A' | 'D';

export interface ConfigDetail {
  configMaster: ConfigMasterCode;
  configId: number;
   configMasterName?: string;
  configName: string;
  delFlag: DelFlag;

  entryBy?: string;
  entryDate?: string;
}

export const CONFIG_MASTER_OPTIONS: { value: ConfigMasterCode; label: string; description: string }[] = [
  { value: 'ROLE', label: 'ROLE – User Role',          description: 'Login roles offered on User Maintenance and the Login screen' },
  { value: 'STUD', label: 'STUD – Student Type',      description: 'Internship / Training type used on Student Master'        },
  { value: 'MODE', label: 'MODE – Study Mode',         description: 'Online / Offline / Hybrid delivery mode'                  },
  { value: 'TRAN', label: 'TRAN – Progress Status',    description: 'Student progress / transaction status'                    },
  { value: 'FREQ', label: 'FREQ – Duration Frequency', description: 'Fee/duration frequency used on Student Master'            },
];

export function configMasterDescription(code: ConfigMasterCode): string {
  return CONFIG_MASTER_OPTIONS.find(o => o.value === code)?.description ?? '';
}

export function configMasterLabel(code: ConfigMasterCode): string {
  return CONFIG_MASTER_OPTIONS.find(o => o.value === code)?.label ?? code;
}


export function parseCodeLabel(configName: string): { code: string; label: string } {
  const name = (configName ?? '').trim();
  const dashIdx = name.search(/[-–—]/);
  if (dashIdx > 0) {
    const code = name.slice(0, dashIdx).trim().toUpperCase();
    if (code) {
      return { code: code.slice(0, 2), label: name };
    }
  }
  return { code: name.slice(0, 2).toUpperCase(), label: name };
}
