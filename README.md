# Tokenomics workshops DApp

The goal of this distributed application is to incentivize educational workshops related to tokenomics

DApp operates to Educational Token (EDC) and Workshop contracts deployed into POA.Network.

As per DApp you the owner of Workshop contract can:
* create and close workshops (tokenomics game)
* add new participants
* register titles of new project generated during a tokenomics game
* provide tokens to participants of a tokenomics game

The DApp was written as per request of https://t.me/rustamd (Rustam Davletbayev). So, please contact to him if you have any questions.

* EDC token (ERC20-based) contract at POA.Network: `0xc7b4618d03a756f8345bd1bf1cccbe3681f823ef`
* Workshops contract at POA.Network: `0x9296d4387cb2ceac073c43969c5997410fa9b31a`

Game interface available on: https://tokenomics-workshops.herokuapp.com/

## Contract re-deploy

As soon as new contracts re-deploied, the section `networks` needs to be updated in JSONs located in `abi`-directory. New contract addressed and transaction hashes need should be provided there. 
