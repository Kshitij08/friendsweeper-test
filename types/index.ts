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
  metadata?: NFTMetadata;
  imageUrl?: string;
  error?: string;
}

export interface Listing {
  seller: string;
  price: string;
  isListed: boolean;
  listingTime: string;
}

export interface ListNFTRequest {
  tokenId: string;
  price: string; // Price in wei
  userAddress: string;
}

export interface ListNFTResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export interface BuyNFTRequest {
  tokenId: string;
  buyerAddress: string;
}

export interface BuyNFTResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export interface GetListingRequest {
  tokenId: string;
}

export interface GetListingResponse {
  success: boolean;
  listing?: Listing;
  error?: string;
}
