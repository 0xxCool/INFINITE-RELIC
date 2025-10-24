# 📊 Infinite Relic - Subgraph

The Graph subgraph for indexing Infinite Relic on-chain data.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Update contract address in subgraph.yaml

# Generate types
npm run codegen

# Build
npm run build

# Deploy to The Graph Studio
npm run deploy
```

## 📦 Schema

### User
- Ethereum address
- Total principal deposited
- Total yield claimed
- Relic count
- Associated relics & claims

### Relic
- Token ID
- Owner (User)
- Principal amount
- Lock period & end timestamp
- Mint timestamp
- Total yield claimed
- Claim count

### Claim
- Unique ID
- User & Relic references
- Amount claimed
- Timestamp
- Transaction hash

### Protocol
- Aggregate stats:
  - Total relics minted
  - Total principal
  - Total yield claimed
  - Unique users

## 🔧 Configuration

### Update Contract Address

Edit `subgraph.yaml`:

```yaml
source:
  address: "0xYOUR_VAULT_ADDRESS"
  startBlock: 12345678  # Block when contract was deployed
```

### Add ABIs

Copy contract ABIs to `abis/`:

```bash
cp ../contracts/artifacts/contracts/RelicVault.sol/RelicVault.json abis/
```

## 📊 Example Queries

### Get User Stats

```graphql
{
  user(id: "0x...") {
    totalPrincipal
    totalYieldClaimed
    relicCount
    relics {
      id
      principal
      lockDays
      totalYieldClaimed
    }
  }
}
```

### Get All Relics

```graphql
{
  relics(first: 100, orderBy: mintedAt, orderDirection: desc) {
    id
    principal
    lockDays
    lockEnd
    owner {
      id
    }
  }
}
```

### Protocol Stats

```graphql
{
  protocol(id: "protocol") {
    totalRelics
    totalPrincipal
    totalYieldClaimed
    uniqueUsers
  }
}
```

## 🚀 Deployment

### The Graph Studio

1. Create account: https://thegraph.com/studio
2. Create new subgraph: "relic"
3. Get deploy key
4. Deploy:

```bash
graph auth --studio <DEPLOY_KEY>
npm run deploy
```

### Local Graph Node

```bash
# Start graph node
docker-compose -f docker-compose-graph.yml up -d

# Create subgraph
npm run create-local

# Deploy
npm run deploy-local
```

## 📚 Resources

- [The Graph Docs](https://thegraph.com/docs)
- [AssemblyScript](https://www.assemblyscript.org/)
- [GraphQL](https://graphql.org/)

---

**Made with ❤️ for the Infinite Relic community**
