interface Props {
  variante?: 'completo' | 'compacto' | 'icone';
  altura?: number;
}

export default function LogoSigare({ variante = 'completo', altura = 40 }: Props) {
  if (variante === 'icone') {
    return (
      <svg width={altura} height={altura} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="SIGARE">
        <polygon points="50,4 91,27 91,73 50,96 9,73 9,27" fill="none" stroke="#e9b94e" strokeWidth="5"/>
        <polygon points="50,22 74,35 74,65 50,78 26,65 26,35" fill="#e9b94e" fillOpacity="0.15"/>
        <rect x="32" y="38" width="36" height="6" rx="3" fill="#e9b94e"/>
        <rect x="32" y="49" width="26" height="6" rx="3" fill="#e9b94e" opacity="0.7"/>
        <rect x="32" y="60" width="16" height="6" rx="3" fill="#e9b94e" opacity="0.4"/>
        <circle cx="64" cy="62" r="6" fill="#e9b94e"/>
      </svg>
    );
  }

  if (variante === 'compacto') {
    return (
      <svg width={Math.round(altura * 3.8)} height={altura} viewBox="0 0 190 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="SIGARE">
        {/* Ícone hexágono */}
        <polygon points="25,2 46,13 46,37 25,48 4,37 4,13" fill="none" stroke="#e9b94e" strokeWidth="2.5"/>
        <polygon points="25,12 38,19 38,31 25,38 12,31 12,19" fill="#e9b94e" fillOpacity="0.15"/>
        <rect x="16" y="19" width="18" height="3.5" rx="1.75" fill="#e9b94e"/>
        <rect x="16" y="24.5" width="13" height="3.5" rx="1.75" fill="#e9b94e" opacity="0.7"/>
        <rect x="16" y="30" width="8" height="3.5" rx="1.75" fill="#e9b94e" opacity="0.4"/>
        <circle cx="32" cy="31" r="3.5" fill="#e9b94e"/>
        {/* Texto */}
        <text x="56" y="30" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="22" letterSpacing="3" fill="#ffffff">SIGARE</text>
        <rect x="56" y="35" width="130" height="1.5" rx="0.75" fill="#e9b94e"/>
        <text x="57" y="46" fontFamily="Arial, sans-serif" fontWeight="400" fontSize="8" letterSpacing="1.5" fill="#a8bcd8">GESTÃO DE EVENTOS</text>
      </svg>
    );
  }

  // completo
  return (
    <svg width={Math.round(altura * 5.5)} height={altura} viewBox="0 0 330 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="SIGARE — Sistema Integrado de Gestão e Alocação de Recursos para Eventos">
      {/* Ícone hexágono */}
      <polygon points="30,3 56,17 56,45 30,59 4,45 4,17" fill="none" stroke="#e9b94e" strokeWidth="3"/>
      <polygon points="30,15 46,23 46,37 30,45 14,37 14,23" fill="#e9b94e" fillOpacity="0.15"/>
      <rect x="20" y="23" width="22" height="4" rx="2" fill="#e9b94e"/>
      <rect x="20" y="30" width="15" height="4" rx="2" fill="#e9b94e" opacity="0.7"/>
      <rect x="20" y="37" width="9" height="4" rx="2" fill="#e9b94e" opacity="0.4"/>
      <circle cx="38" cy="38.5" r="4.5" fill="#e9b94e"/>
      {/* Texto SIGARE */}
      <text x="72" y="36" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="28" letterSpacing="4" fill="#ffffff">SIGARE</text>
      {/* Linha dourada */}
      <rect x="72" y="41" width="254" height="1.5" rx="0.75" fill="#e9b94e"/>
      {/* Subtítulo */}
      <text x="73" y="55" fontFamily="Arial, sans-serif" fontWeight="400" fontSize="9" letterSpacing="1.5" fill="#a8bcd8">SISTEMA INTEGRADO DE GESTÃO DE EVENTOS</text>
    </svg>
  );
}
