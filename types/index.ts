export interface SafeAreaInsets {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
}

export interface MintNFTRequest {
  gameResult: {
    gameWon: boolean;
    grid: any[][];
    killedBy?: any;
    followers: any[];
    boardImage?: string;
    solvingTime?: number;
  };
  userFid?: string;
  userAddress?: string;
}

export interface MintNFTResponse {
  success: boolean;
  tokenId?: string;
  transactionHash?: string;
  error?: string;
}
