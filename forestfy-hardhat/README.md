# Forestfy - Web3 Focus App

Forestfy es una aplicación Web3 inspirada en Forest, que permite a los usuarios bloquear sus tokens por un período de tiempo para mantener el enfoque, y como recompensa, mintear NFTs de árboles con diferentes rarezas.

## Características

- **Staking de Tokens**: Bloquea tus tokens por un período de tiempo para mantener el enfoque
- **NFTs de Árboles**: Al completar el período de staking, mintea un NFT de árbol con diferentes rarezas
- **Sistema de Rarezas**: Los NFTs pueden ser Normal (70%), Raro (25%) o Legendario (5%)
- **Marketplace**: Vende tus NFTs de árboles en el marketplace
- **Sistema de Bonificaciones**: Gana bonificaciones de staking basadas en la cantidad y rareza de tus árboles

## Contratos

### ForestToken (ERC20)
- Token principal usado para staking y marketplace
- Funcionalidades básicas de transferencia, mint y burn

### ForestNFT (ERC721)
- NFTs de árboles con diferentes rarezas
- Sistema de distribución de rarezas
- Tracking de NFTs por rareza por usuario

### ForestStaking
- Sistema de staking con duración mínima
- Recompensas basadas en tiempo de staking
- Bonificaciones por posesión de NFTs
- Mint automático de NFTs al completar el staking

### ForestMarketplace
- Marketplace para vender NFTs
- Sistema de fees (2%)
- Gestión de listados y compras

## Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/forestfy.git
cd forestfy
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env` basado en `.env.example`:
```bash
cp .env.example .env
```

4. Configura las variables de entorno en `.env`:
- `PRIVATE_KEY`: Tu clave privada para deploy (sin el 0x)
- `SEPOLIA_RPC_URL`: URL del RPC de Sepolia

## Desarrollo

1. Compila los contratos:
```bash
npm run compile
```

2. Ejecuta los tests:
```bash
npm test
```

3. Despliega en red local:
```bash
npm run deploy
```

4. Despliega en testnet (Sepolia):
```bash
npm run deploy:testnet
```

## Bonificaciones de Staking

Las bonificaciones se calculan según la cantidad y rareza de los NFTs poseídos:

- NFT Normal: +5% de bonificación
- NFT Raro: +15% de bonificación
- NFT Legendario: +30% de bonificación

Las bonificaciones son acumulativas, por lo que tener múltiples NFTs aumenta tu bonificación total.

## Marketplace

El marketplace cobra un fee del 2% sobre cada venta. Los fees son acumulados y pueden ser retirados por el owner del contrato.

## Licencia

ISC
