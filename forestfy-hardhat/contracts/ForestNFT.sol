// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ForestNFT is ERC721URIStorage, Ownable {
    // Reemplazar Counters por un uint256
    uint256 private _nextTokenId;

    // Enumeración de rarezas
    enum Rarity { NORMAL, RARE, LEGENDARY }
    
    // Probabilidades de mint (en porcentaje)
    uint256 public constant NORMAL_CHANCE = 70;  // 70%
    uint256 public constant RARE_CHANCE = 25;    // 25%
    uint256 public constant LEGENDARY_CHANCE = 5; // 5%

    // Mapeo de tokenId a rareza
    mapping(uint256 => Rarity) public tokenRarity;
    
    // Mapeo de dirección a cantidad de NFTs por rareza
    mapping(address => mapping(Rarity => uint256)) public userNFTsByRarity;

    constructor() ERC721("Forest Tree", "FTREE") Ownable(msg.sender) {}

    function mint(address to) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        
        // Determinar la rareza basada en probabilidades
        Rarity rarity = determineRarity();
        
        // Asignar la rareza al token
        tokenRarity[tokenId] = rarity;
        
        // Crear el URI del token basado en la rareza
        string memory tokenURI = createTokenURI(rarity);
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        return tokenId;
    }

    function determineRarity() internal view returns (Rarity) {
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % 100;
        
        if (random < LEGENDARY_CHANCE) {
            return Rarity.LEGENDARY;
        } else if (random < LEGENDARY_CHANCE + RARE_CHANCE) {
            return Rarity.RARE;
        } else {
            return Rarity.NORMAL;
        }
    }

    function createTokenURI(Rarity rarity) internal pure returns (string memory) {
        if (rarity == Rarity.LEGENDARY) {
            return "ipfs://legendary-tree-uri";
        } else if (rarity == Rarity.RARE) {
            return "ipfs://rare-tree-uri";
        } else {
            return "ipfs://normal-tree-uri";
        }
    }

    function getNFTsByRarity(address user, Rarity rarity) public view returns (uint256) {
        return userNFTsByRarity[user][rarity];
    }

    // Función para transferir NFT y actualizar conteos
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0)) { // Si no es un mint
            userNFTsByRarity[from][tokenRarity[tokenId]]--;
        }
        if (to != address(0)) { // Si no es un burn
            userNFTsByRarity[to][tokenRarity[tokenId]]++;
        }
        return super._update(to, tokenId, auth);
    }
} 