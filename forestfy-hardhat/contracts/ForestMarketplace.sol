// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ForestNFT.sol";

contract ForestMarketplace is Ownable, ReentrancyGuard {
    IERC721 public forestNFT;
    IERC20 public forestToken;

    // Estructura para las listas de venta
    struct Listing {
        address seller;
        uint256 price;
        bool isActive;
    }

    // Mapeo de tokenId a su lista
    mapping(uint256 => Listing) public listings;

    // Fee del marketplace (2%)
    uint256 public constant MARKETPLACE_FEE = 2;

    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event NFTUnlisted(uint256 indexed tokenId, address indexed seller);

    constructor(address _forestNFT, address _forestToken) Ownable(msg.sender) {
        forestNFT = IERC721(_forestNFT);
        forestToken = IERC20(_forestToken);
    }

    function listNFT(uint256 tokenId, uint256 price) external {
        require(forestNFT.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(price > 0, "Price must be greater than 0");
        require(forestNFT.getApproved(tokenId) == address(this) || 
                forestNFT.isApprovedForAll(msg.sender, address(this)), "Not approved");

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            isActive: true
        });

        emit NFTListed(tokenId, msg.sender, price);
    }

    function buyNFT(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.isActive, "Not for sale");
        require(msg.sender != listing.seller, "Cannot buy your own NFT");

        uint256 price = listing.price;
        uint256 fee = (price * MARKETPLACE_FEE) / 100;
        uint256 sellerAmount = price - fee;

        // Transferir tokens del comprador al contrato
        require(forestToken.transferFrom(msg.sender, address(this), price), "Token transfer failed");

        // Transferir tokens al vendedor (menos el fee)
        require(forestToken.transfer(listing.seller, sellerAmount), "Seller transfer failed");

        // Transferir el NFT al comprador
        forestNFT.transferFrom(listing.seller, msg.sender, tokenId);

        // Marcar la lista como inactiva
        listing.isActive = false;

        emit NFTSold(tokenId, listing.seller, msg.sender, price);
    }

    function unlistNFT(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        require(listing.isActive, "Not listed");
        require(listing.seller == msg.sender, "Not the seller");

        listing.isActive = false;

        emit NFTUnlisted(tokenId, msg.sender);
    }

    function updateListing(uint256 tokenId, uint256 newPrice) external {
        Listing storage listing = listings[tokenId];
        require(listing.isActive, "Not listed");
        require(listing.seller == msg.sender, "Not the seller");
        require(newPrice > 0, "Price must be greater than 0");

        listing.price = newPrice;

        emit NFTListed(tokenId, msg.sender, newPrice);
    }

    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }

    // Función para que el owner pueda retirar los fees acumulados
    function withdrawFees() external onlyOwner {
        uint256 balance = forestToken.balanceOf(address(this));
        require(balance > 0, "No fees to withdraw");
        require(forestToken.transfer(owner(), balance), "Transfer failed");
    }
} 