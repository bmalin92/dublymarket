export function getHealerColor(healerName: string, isDark: boolean): string {
  switch (healerName) {
    case 'Holy Priest':
      return '#FFD600'; // Pale gold
    case 'Discipline Priest':
      return isDark ? '#FFFFFF' : '#7F7F7F';
    case 'Restoration Druid':
      return '#FF7C0A'; // Druid Orange
    case 'Restoration Shaman':
      return '#0070DD'; // Shaman Blue
    case 'Holy Paladin':
      return '#F48CBA'; // Paladin Pink
    case 'Mistweaver Monk':
      return '#00FF98'; // Monk Green
    case 'Preservation Evoker':
      return '#33937F'; // Evoker Teal
    case 'Bard Hunter':
      return '#AAD372'; // Hunter Green
    case 'DPS':
      return '#C41E3A'; // Death Knight Red
    case 'Other':
      return isDark? '#7F7F7F' : '#333333'; // Grey for Other
    default:
      return isDark? '#7F7F7F' : '#333333'; // Grey for Other
  }
}
