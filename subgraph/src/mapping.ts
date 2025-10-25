import { BigInt, Bytes } from '@graphprotocol/graph-ts';
import {
  RelicMinted,
  YieldClaimed,
} from '../generated/RelicVault/RelicVault';
import { User, Relic, Claim, Protocol } from '../generated/schema';

export function handleRelicMinted(event: RelicMinted): void {
  // Load or create user
  let user = User.load(event.params.user.toHex());
  let isNewUser = false;
  if (!user) {
    user = new User(event.params.user.toHex());
    user.totalPrincipal = BigInt.fromI32(0);
    user.totalYieldClaimed = BigInt.fromI32(0);
    user.relicCount = 0;
    user.createdAt = event.block.timestamp;
    isNewUser = true;
  }
  user.totalPrincipal = user.totalPrincipal.plus(event.params.principal);
  user.relicCount = user.relicCount + 1;
  user.updatedAt = event.block.timestamp;
  user.save();

  // Create relic
  let relic = new Relic(event.params.tokenId.toString());
  relic.owner = user.id;
  relic.principal = event.params.principal;
  relic.lockDays = event.params.lockDays;
  relic.lockEnd = event.block.timestamp.plus(
    BigInt.fromI32(event.params.lockDays).times(BigInt.fromI32(86400))
  );
  relic.mintedAt = event.block.timestamp;
  relic.totalYieldClaimed = BigInt.fromI32(0);
  relic.claimCount = 0;
  relic.save();

  // Update protocol stats
  let protocol = getOrCreateProtocol();
  protocol.totalRelics = protocol.totalRelics + 1;
  protocol.totalPrincipal = protocol.totalPrincipal.plus(event.params.principal);

  // Increment unique users counter if this is a new user
  if (isNewUser) {
    protocol.uniqueUsers = protocol.uniqueUsers + 1;
  }

  protocol.updatedAt = event.block.timestamp;
  protocol.save();
}

export function handleYieldClaimed(event: YieldClaimed): void {
  // Load entities
  let user = User.load(event.params.user.toHex());
  if (!user) return; // Should never happen

  let relic = Relic.load(event.params.tokenId.toString());
  if (!relic) return; // Should never happen

  // Create claim record
  let claimId = event.transaction.hash.toHex() + '-' + event.logIndex.toString();
  let claim = new Claim(claimId);
  claim.user = user.id;
  claim.relic = relic.id;
  claim.amount = event.params.amount;
  claim.timestamp = event.block.timestamp;
  claim.transactionHash = event.transaction.hash;
  claim.save();

  // Update user stats
  user.totalYieldClaimed = user.totalYieldClaimed.plus(event.params.amount);
  user.updatedAt = event.block.timestamp;
  user.save();

  // Update relic stats
  relic.totalYieldClaimed = relic.totalYieldClaimed.plus(event.params.amount);
  relic.claimCount = relic.claimCount + 1;
  relic.save();

  // Update protocol stats
  let protocol = getOrCreateProtocol();
  protocol.totalYieldClaimed = protocol.totalYieldClaimed.plus(event.params.amount);
  protocol.updatedAt = event.block.timestamp;
  protocol.save();
}

function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load('protocol');
  if (!protocol) {
    protocol = new Protocol('protocol');
    protocol.totalRelics = 0;
    protocol.totalPrincipal = BigInt.fromI32(0);
    protocol.totalYieldClaimed = BigInt.fromI32(0);
    protocol.uniqueUsers = 0;
    protocol.updatedAt = BigInt.fromI32(0);
  }
  return protocol;
}
