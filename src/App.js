import metamask from "../src/assets/img/metamask-fox.svg";
import "./App.css";
import 'bootstrap/dist/css/bootstrap.min.css';
// import { ethers } from 'ethers';
import {useEffect, useState} from "react";
import axios from "axios";
import Web3EthContract from "web3-eth-contract";
import Table from 'react-bootstrap/Table';

import contract from "./contract/contract.json";
const { ethereum } = window;
Web3EthContract.setProvider(ethereum);
const smartContractObj = new Web3EthContract(
  contract,
  process.env.REACT_APP_CONTRACT_URL
)

function App() {
  // let ethersProvider;
  const [firstLoad, setFirstLoad] = useState(true)
  const [account, setAccount] = useState(null)
  const [networkId, setNetworkId] = useState(null);
  const [signResult, setSignResult] = useState(null);
  const [totalSupply, setTotalSupply] = useState(0);
  const [totalMint, setTotalMint] = useState(0);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [transactions, setTransactions] = useState(null);
  // const [msgParams, setMsgParams] = useState(null);

  useEffect(() =>{
    if (firstLoad){
      initialize();
    }
  }, [firstLoad])

  const initialize = async () => {
    try {
      const totalSupply = await smartContractObj.methods.MAX_ELEMENTS().call();
      const minted = await smartContractObj.methods.totalSupply().call();
      setTotalMint(minted);
      setTotalSupply(totalSupply);
      console.log("--", totalSupply, minted);
    } catch (error) {
      console.error(error);
    }
    setFirstLoad(false);
  }

  const reloadData = async () => {
    const minted = await smartContractObj.methods.totalSupply().call();
    setTotalMint(minted);
    console.log("--", minted, account);
    const balance = await smartContractObj.methods.balanceOf(account[0]).call();
    console.log("balance", balance)
    setBalance(balance);
  }
  const onConnect = async () => {
    try {
      const newAccounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      const networkId = await window.ethereum.request({
        method: "net_version",
      });
      const admins = process.env.REACT_APP_ADMIN;
      console.log("admins", admins, newAccounts[0])
      if (admins.toLowerCase() == newAccounts[0].toLowerCase()) {
          console.log("its admin")
          setIsAdmin(true);
          const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/crypto/list`)
          console.log("transactions", res.data.transactions)
          setTransactions(res.data.transactions)
       }
      console.log(newAccounts)
      handleNewAccounts(newAccounts);
      handleNetworkId(networkId);
      const balance = await smartContractObj.methods.balanceOf(newAccounts[0]).call();
      setBalance(balance);
    } catch (error) {
      console.error(error);
    }
  }

  const handleNewAccounts = (newAccounts) => {
    setAccount(newAccounts)
  }

  const handleNetworkId = (newNetwork) =>{
    setNetworkId(newNetwork);
  }
  const signDataV4 = async () =>{
    try{
      const msgParams = {
        domain: {
          chainId: networkId.toString(),
          name: 'Ether Mail',
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
          version: '1',
        },
        message: {
          tokenID: totalMint,
          minter: account[0]
        },
        primaryType: 'Mail',
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Mail: [
            { name: 'tokenID', type: 'uint256' },
            { name: 'minter', type: 'address' }
          ],
        }
      }
      setLoading(true);
      const from = account[0];
      console.log("account", msgParams, from)
      const sign = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [from, JSON.stringify(msgParams)],
      })
      setSignResult(sign);
      // setMsgParams(msgParams)
      const data = {
        sign: sign,
        msgParams: JSON.stringify(msgParams)
      }
      console.log("data", data);
      axios.post(`${process.env.REACT_APP_BACKEND_URL}/crypto/verify`, data)
      .then((res) => {
        reloadData();
        setLoading(false);
        console.log("response", res.data)
      })
    } catch (err) {
      setLoading(false);
      console.error(err);
    }
  }
  
  return (
    <div className="App">
      <header>
        <div id="logo-container">
          <h1 id="logo-text" className="text-center">
            OasisX Test
          </h1>
          <img src={metamask} />
        </div>
      </header>
      <section>
        <div className="row d-flex justify-content-center">
          <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12">
            <div className="card">
              <div className="card-body">
                <h4 className="card-title">Mint OasisX</h4>
                <h5 className="card-title">{totalMint}/{totalSupply}</h5>
                {
                  account === null ? (
                    <div>
                      <button
                        className="btn btn-primary btn-lg btn-block mb-3"
                        id="connectButton"
                        onClick = {()=> onConnect()}
                      >
                        Connect
                      </button>
                    </div>
                  ):(
                    <div>
                      <button
                        className="btn btn-primary btn-lg btn-block mb-3"
                        id="connectButton"
                        disabled
                      >
                        Connected
                      </button>
                      { 
                        loading?(
                          <button
                            className="btn btn-primary btn-lg btn-block mb-3"
                            id="connectButton"
                            disabled
                          >
                            Wait
                          </button>
                        ):
                        (
                          <button
                            className="btn btn-primary btn-lg btn-block mb-3"
                            id="connectButton"
                            onClick = {() => signDataV4()}
                          >
                            Sign
                          </button>
                        )
                      }
                    </div>
                  )
                }
                <p className="info-text alert alert-secondary">
                  eth_accounts result: <span>{account}</span>
                </p>
                <p className="info-text alert alert-secondary">
                  You have minted <span>{balance}</span> OasisX.
                </p>
              </div>
            </div>
          </div>
        </div>
        { 
        isAdmin &&(
          <div className="row d-flex justify-content-center" style={{marginTop: "2em"}}>
            <div className="col-xl-12 col-lg-6 col-md-12 col-sm-12 col-12">
              <div className="card">
                <div className="card-body">
                    <h4 className="card-title">OasisX Admin</h4>
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>Minter</th>
                          <th>TokenID</th>
                          <th>Hash</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                        transactions !== null && 
                          transactions.map((transaction, index) =>(
                            <tr key={index}>
                              <td>{transaction.signer}</td>
                              <td>{transaction.tokenID}</td>
                              <td>{transaction.hash}</td>
                              {transaction.status ===1 &&
                              (
                                <td>Required</td>
                              )
                              }
                              {transaction.status ===3 &&
                              (
                                <td>Success</td>
                              )
                              }
                              {transaction.status ===2 &&
                              (
                                <td>Fail</td>
                              )
                              }
                            </tr>
                          ))
                        
                          
                        }
                        
                      </tbody>
                    </Table>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
