import metamask from "../src/assets/img/metamask-fox.svg";
import "./App.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { ethers } from 'ethers';
import {useEffect, useState} from "react";
import axios from "axios";

function App() {
  let ethersProvider;
  const [firstLoad, setFirstLoad] = useState(true)
  const [account, setAccount] = useState(null)
  const [networkId, setNetworkId] = useState(null);
  const [signResult, setSignResult] = useState(null);
  const [msgParams, setMsgParams] = useState(null);

  useEffect(() =>{
    if (firstLoad){
      initialize();
    }
  }, [firstLoad])

  const initialize = async () => {
    try {
      // We must specify the network as 'any' for ethers to allow network changes
      ethersProvider = new ethers.providers.Web3Provider(window.ethereum, 'any');
    } catch (error) {
      console.error(error);
    }
    setFirstLoad(false);
  }
  const onConnect = async () => {
    try {
      const newAccounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      const networkId = await window.ethereum.request({
        method: "net_version",
      });
      console.log(newAccounts)
      handleNewAccounts(newAccounts);
      handleNetworkId(networkId);
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
    const msgParams = {
      domain: {
        chainId: networkId.toString(),
        name: 'Ether Mail',
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        version: '1',
      },
      message: {
        tokenID: 123,
        minter : account[0],
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
    
    try{
      const from = account[0];
      console.log("account", msgParams, from)
      const sign = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [from, JSON.stringify(msgParams)],
      })
      setSignResult(sign);
      setMsgParams(msgParams)
      const data = {
        sign: signResult,
        msgParams: JSON.stringify(msgParams)
      }
      console.log("data", data);
      axios.post(`${process.env.REACT_APP_BACKEND_URL}/crypto/verify`, data)
      .then((res) => {
        console.log("response", res.data)
      })
    } catch (err) {
      console.error(err);
      // signTypedDataV4Result.innerHTML = `Error: ${err.message}`;
    }
  }
  const verifyDataV4 = async () => {
    

    
  }
  return (
    <div className="App">
      <header>
        <div id="logo-container">
          <h1 id="logo-text" className="text-center">
            E2E Test Dapp
          </h1>

          <img src={metamask} />
        </div>
      </header>
      
      <section>
        <div className="row d-flex justify-content-center">
          <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12">
            <div className="card">
              <div className="card-body">
                <h4 className="card-title">Basic Actions</h4>

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
                      <button
                        className="btn btn-primary btn-lg btn-block mb-3"
                        id="connectButton"
                        onClick = {() => signDataV4()}
                      >
                        Sign
                      </button>
                    </div>
                  )
                }
                {/* { 
                  signResult !== null && (
                    <button
                      className="btn btn-primary btn-lg btn-block mb-3"
                      id="connectButton"
                      onClick = {()=> verifyDataV4()}
                    >
                      Verify
                    </button>
                  ) 
                } */}
                <p className="info-text alert alert-secondary">
                  eth_accounts result: <span>{account}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
