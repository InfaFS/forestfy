// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ForestNFT.sol";

contract ForestStaking is Ownable {
    IERC20 public forestToken;
    ForestNFT public forestNFT;

    // Estructura para el staking
    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 duration;
        bool isActive;
    }

    // Mapeo de usuario a sus stakes
    mapping(address => Stake[]) public userStakes;

    // Bonificaciones por rareza (en porcentaje)
    uint256 public constant NORMAL_BONUS = 5;    // 5%
    uint256 public constant RARE_BONUS = 15;     // 15%
    uint256 public constant LEGENDARY_BONUS = 30; // 30%

    // Duración mínima de staking (en segundos)
    uint256 public constant MIN_STAKE_DURATION = 30 minutes;
    
    // Tasa base de recompensa por hora (en tokens)
    uint256 public constant BASE_REWARD_RATE = 1;

    event Staked(address indexed user, uint256 amount, uint256 duration);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    event NFTMinted(address indexed user, uint256 tokenId);

    constructor(address _forestToken, address _forestNFT) Ownable(msg.sender) {
        forestToken = IERC20(_forestToken);
        forestNFT = ForestNFT(_forestNFT);
    }

    function stake(uint256 amount, uint256 duration) external {
        require(duration >= MIN_STAKE_DURATION, "Duration too short");
        require(amount > 0, "Amount must be greater than 0");
        require(forestToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        userStakes[msg.sender].push(Stake({
            amount: amount,
            startTime: block.timestamp,
            duration: duration,
            isActive: true
        }));

        emit Staked(msg.sender, amount, duration);
    }

    function calculateBonus(address user) public view returns (uint256) {
        uint256 normalNFTs = forestNFT.getNFTsByRarity(user, ForestNFT.Rarity.NORMAL);
        uint256 rareNFTs = forestNFT.getNFTsByRarity(user, ForestNFT.Rarity.RARE);
        uint256 legendaryNFTs = forestNFT.getNFTsByRarity(user, ForestNFT.Rarity.LEGENDARY);

        uint256 totalBonus = 0;
        totalBonus += normalNFTs * NORMAL_BONUS;
        totalBonus += rareNFTs * RARE_BONUS;
        totalBonus += legendaryNFTs * LEGENDARY_BONUS;

        return totalBonus;
    }

    function unstake(uint256 stakeIndex) external {
        require(stakeIndex < userStakes[msg.sender].length, "Invalid stake index");
        Stake storage stake = userStakes[msg.sender][stakeIndex];
        require(stake.isActive, "Stake not active");
        require(block.timestamp >= stake.startTime + stake.duration, "Staking period not ended");

        uint256 reward = calculateReward(msg.sender, stakeIndex);
        stake.isActive = false;

        // Transferir tokens originales + recompensa
        require(forestToken.transfer(msg.sender, stake.amount + reward), "Transfer failed");

        // Mintear NFT como recompensa
        uint256 tokenId = forestNFT.mint(msg.sender);

        emit Unstaked(msg.sender, stake.amount, reward);
        emit NFTMinted(msg.sender, tokenId);
    }

    function calculateReward(address user, uint256 stakeIndex) public view returns (uint256) {
        Stake storage stake = userStakes[user][stakeIndex];
        require(stake.isActive, "Stake not active");

        uint256 stakingDuration = block.timestamp - stake.startTime;
        uint256 hoursStaked = stakingDuration / 1 hours;
        
        // Calcular recompensa base
        uint256 baseReward = (stake.amount * BASE_REWARD_RATE * hoursStaked) / 100;
        
        // Aplicar bonificación por NFTs
        uint256 bonus = calculateBonus(user);
        uint256 bonusReward = (baseReward * bonus) / 100;
        
        return baseReward + bonusReward;
    }

    function getActiveStakes(address user) external view returns (Stake[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < userStakes[user].length; i++) {
            if (userStakes[user][i].isActive) {
                activeCount++;
            }
        }

        Stake[] memory activeStakes = new Stake[](activeCount);
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < userStakes[user].length; i++) {
            if (userStakes[user][i].isActive) {
                activeStakes[currentIndex] = userStakes[user][i];
                currentIndex++;
            }
        }
        return activeStakes;
    }
} 