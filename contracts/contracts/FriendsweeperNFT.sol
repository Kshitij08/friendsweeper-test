// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract FriendsweeperNFT is ERC1155, ERC2981, Ownable {
    using Strings for uint256;
    
    uint256 private _tokenIds;
    
    // Base URI for metadata
    string private _baseTokenURI;
    
    // Mapping from token ID to metadata URI
    mapping(uint256 => string) private _tokenURIs;
    
    // Marketplace listing info
    mapping(uint256 => Listing) private _listings;
    
    // Royalty recipient address
    address public constant ROYALTY_RECIPIENT = 0xF51Fe86498b83538E902e160F2D80c34C7d6b816;
    uint96 public constant ROYALTY_PERCENTAGE = 500; // 5% = 500 basis points
    
    struct Listing {
        address seller;
        uint256 price;
        bool isListed;
        uint256 listingTime;
    }
    
    // Events
    event NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI, uint256 amount);
    event NFTListed(address indexed seller, uint256 indexed tokenId, uint256 price);
    event NFTSold(address indexed seller, address indexed buyer, uint256 indexed tokenId, uint256 price);
    event NFTDelisted(address indexed seller, uint256 indexed tokenId);
    
    constructor() ERC1155("") Ownable(msg.sender) {
        _baseTokenURI = "";
        // Set default royalty to 5% for the specified recipient
        _setDefaultRoyalty(ROYALTY_RECIPIENT, ROYALTY_PERCENTAGE);
    }
    
    /**
     * @dev Mints a new NFT for the given address with the specified metadata URI
     * @param to The address that will own the minted NFT
     * @param metadataURI The metadata URI for the NFT
     * @param amount The amount to mint (usually 1 for unique NFTs)
     * @return The ID of the newly minted NFT
     */
    function mint(address to, string memory metadataURI, uint256 amount) public onlyOwner returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");
        require(amount > 0, "Amount must be greater than 0");
        
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _mint(to, newTokenId, amount, "");
        _setTokenURI(newTokenId, metadataURI);
        
        emit NFTMinted(to, newTokenId, metadataURI, amount);
        
        return newTokenId;
    }
    
    /**
     * @dev Public mint function that allows users to mint their own NFTs
     * @param metadataURI The metadata URI for the NFT
     * @param amount The amount to mint (usually 1 for unique NFTs)
     * @return The ID of the newly minted NFT
     */
    function mintNFT(string memory metadataURI, uint256 amount) public returns (uint256) {
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");
        require(amount > 0, "Amount must be greater than 0");
        
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _mint(msg.sender, newTokenId, amount, "");
        _setTokenURI(newTokenId, metadataURI);
        
        emit NFTMinted(msg.sender, newTokenId, metadataURI, amount);
        
        return newTokenId;
    }
    
    /**
     * @dev Batch mints multiple NFTs
     * @param to The address that will own the minted NFTs
     * @param metadataURIs Array of metadata URIs
     * @param amounts Array of amounts to mint
     * @return Array of token IDs
     */
    function batchMint(address to, string[] memory metadataURIs, uint256[] memory amounts) public onlyOwner returns (uint256[] memory) {
        require(to != address(0), "Cannot mint to zero address");
        require(metadataURIs.length == amounts.length, "Arrays length mismatch");
        require(metadataURIs.length > 0, "Arrays cannot be empty");
        
        uint256[] memory tokenIds = new uint256[](metadataURIs.length);
        
        for (uint256 i = 0; i < metadataURIs.length; i++) {
            require(bytes(metadataURIs[i]).length > 0, "Metadata URI cannot be empty");
            require(amounts[i] > 0, "Amount must be greater than 0");
            
            _tokenIds++;
            uint256 newTokenId = _tokenIds;
            
            _mint(to, newTokenId, amounts[i], "");
            _setTokenURI(newTokenId, metadataURIs[i]);
            
            tokenIds[i] = newTokenId;
            
            emit NFTMinted(to, newTokenId, metadataURIs[i], amounts[i]);
        }
        
        return tokenIds;
    }
    
    /**
     * @dev List an NFT for sale
     * @param tokenId The ID of the token to list
     * @param price The price in wei
     */
    function listNFT(uint256 tokenId, uint256 price) public {
        require(balanceOf(msg.sender, tokenId) > 0, "You don't own this NFT");
        require(price > 0, "Price must be greater than 0");
        require(!_listings[tokenId].isListed, "NFT is already listed");
        
        _listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            isListed: true,
            listingTime: block.timestamp
        });
        
        emit NFTListed(msg.sender, tokenId, price);
    }
    
    /**
     * @dev Buy an NFT from the marketplace
     * @param tokenId The ID of the token to buy
     */
    function buyNFT(uint256 tokenId) public payable {
        Listing memory listing = _listings[tokenId];
        require(listing.isListed, "NFT is not listed for sale");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy your own NFT");
        
        // Calculate royalty (5%)
        uint256 royaltyAmount = (listing.price * ROYALTY_PERCENTAGE) / 10000;
        uint256 sellerAmount = listing.price - royaltyAmount;
        
        // Transfer NFT
        _safeTransferFrom(listing.seller, msg.sender, tokenId, 1, "");
        
        // Transfer payments
        (bool royaltySuccess, ) = ROYALTY_RECIPIENT.call{value: royaltyAmount}("");
        require(royaltySuccess, "Royalty transfer failed");
        
        (bool sellerSuccess, ) = listing.seller.call{value: sellerAmount}("");
        require(sellerSuccess, "Seller payment failed");
        
        // Refund excess payment
        if (msg.value > listing.price) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - listing.price}("");
            require(refundSuccess, "Refund failed");
        }
        
        // Clear listing
        delete _listings[tokenId];
        
        emit NFTSold(listing.seller, msg.sender, tokenId, listing.price);
    }
    
    /**
     * @dev Delist an NFT from the marketplace
     * @param tokenId The ID of the token to delist
     */
    function delistNFT(uint256 tokenId) public {
        Listing memory listing = _listings[tokenId];
        require(listing.isListed, "NFT is not listed");
        require(msg.sender == listing.seller, "Only seller can delist");
        
        delete _listings[tokenId];
        
        emit NFTDelisted(msg.sender, tokenId);
    }
    
    /**
     * @dev Get listing information
     * @param tokenId The ID of the token
     * @return seller The seller address
     * @return price The listing price
     * @return isListed Whether the NFT is listed
     * @return listingTime When the NFT was listed
     */
    function getListing(uint256 tokenId) public view returns (address seller, uint256 price, bool isListed, uint256 listingTime) {
        Listing memory listing = _listings[tokenId];
        return (listing.seller, listing.price, listing.isListed, listing.listingTime);
    }
    
    /**
     * @dev Sets the base URI for all tokens
     * @param baseURI The base URI
     */
    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Sets the token URI for a specific token
     * @param tokenId The ID of the token
     * @param metadataURI The URI for the token metadata
     */
    function _setTokenURI(uint256 tokenId, string memory metadataURI) internal {
        _tokenURIs[tokenId] = metadataURI;
    }
    
    /**
     * @dev Returns the token URI for a given token ID
     * @param tokenId The ID of the token
     * @return The token URI
     */
    function uri(uint256 tokenId) public view virtual override returns (string memory) {
        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseTokenURI;
        
        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }
        // If there is a baseURI but no tokenURI, concatenate the tokenID to the baseURI.
        return string(abi.encodePacked(base, tokenId.toString()));
    }
    
    /**
     * @dev Returns the total number of token types minted
     * @return The total number of token types
     */
    function totalTokenTypes() public view returns (uint256) {
        return _tokenIds;
    }
    
    /**
     * @dev Returns the next token ID that will be minted
     * @return The next token ID
     */
    function nextTokenId() public view returns (uint256) {
        return _tokenIds + 1;
    }
    
    /**
     * @dev Withdraws any ETH sent to the contract
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Emergency function to pause minting (if needed)
     */
    function emergencyPause() public onlyOwner {
        // This is a placeholder for emergency pause functionality
        // You can implement a pause mechanism using OpenZeppelin's Pausable
    }
    
    /**
     * @dev Override required for ERC2981
     */
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal virtual override(ERC1155) {
        super._update(from, to, ids, values);
    }
    
    /**
     * @dev Override required for ERC2981
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
