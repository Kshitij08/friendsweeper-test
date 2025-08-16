// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract FriendsweeperNFT is ERC1155, Ownable {
    using Strings for uint256;
    
    uint256 private _tokenIds;
    
    // Base URI for metadata
    string private _baseTokenURI;
    
    // Mapping from token ID to metadata URI
    mapping(uint256 => string) private _tokenURIs;
    
    // Events
    event NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI, uint256 amount);
    
    constructor() ERC1155("") Ownable(msg.sender) {
        _baseTokenURI = "";
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
}
