import "node-libs-react-native/globals";
import React, { useEffect, useState } from "react";
import Web3 from "web3";
import WalletConnectProviderWrapper, { useWalletConnect, ConnectorEvents } from "@walletconnect/react-native-dapp";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Box, Button, NativeBaseProvider, Text, VStack } from "native-base";
import WalletConnectProvider from "@walletconnect/web3-provider";

const HomePage = () => {
	const connector = useWalletConnect();
	const [address, setAddress] = useState("");
	const [chainId, setChainId] = useState("");
	const [balance, setBalance] = useState("");
	const [web3, setWeb3] = useState(null);

	const handleDisconnectActions = () => {
		setAddress("");
		setChainId("");
		setBalance("");
		setWeb3(null);
	};

	// value initialization & event subscription
	useEffect(() => {
		if (connector.connected) {
			// value initialization on restart
			setAddress(connector.accounts[0]);
			setChainId(connector.chainId.toString());

			// handles chain change & account change events
			connector.on(ConnectorEvents.SESSION_UPDATE, (_, payload) => {
				if (payload) {
					const { chainId, accounts } = payload.params[0];
					connector.chainId = chainId;
					connector.accounts = accounts;
					setAddress(connector.accounts[0]);
					setChainId(connector.chainId.toString());
				}
			});

			// handles disconnect event
			connector.on(ConnectorEvents.DISCONNECT, handleDisconnectActions);
		}
	}, [connector.connected]);

	useEffect(() => {
		if (connector.connected) {
			const wcProvider = new WalletConnectProvider({
				rpc: {
					1: "https://mainnet.infura.io/v3/40917580961f4b3c94552cb41ca2efd6",
					5: "https://goerli.infura.io/v3/40917580961f4b3c94552cb41ca2efd6",
				},
				qrcode: false,
				connector,
			});

			wcProvider
				.enable()
				.then((_) => console.log("provider-enabled"))
				.catch((_) => console.log("provider-enable-failed"));

			const web3 = new Web3(wcProvider);

			setWeb3(web3);
			web3.eth
				.getBalance(connector.accounts[0])
				.then((res) => setBalance(web3.utils.fromWei(res, "ether")))
				.catch((err) => console.log("balance-fetch-failed"));
		}
	}, [address, chainId]);

	const handleConnectionToggle = async () => {
		if (connector.connected) {
			connector
				.killSession()
				.then((_) => console.log("disconnect-successfull"))
				.catch((_) => console.log("disconnect-failed"));
		} else {
			connector
				.connect()
				.then((_) => console.log("connect-successfull"))
				.catch((_) => console.log("connect-failed"));
		}
	};

	return (
		<Box h="100%" p="25px" bg={"teal.200"}>
			<VStack space={6} my="50px">
				<VStack>
					<Text>Account Address:</Text>
					<Text>{connector.accounts ? connector.accounts[0] : ""}</Text>
				</VStack>

				<VStack>
					<Text>Chain:</Text>
					<Text>{connector.chainId || ""}</Text>
				</VStack>

				<VStack>
					<Text>Balance:</Text>
					<Text>{balance}</Text>
				</VStack>

				<Button onPress={handleConnectionToggle}>{connector.connected ? "Disconnect" : "Connect Wallet"}</Button>

				<Button onPress={() => connector.updateChain()}>Change Chain</Button>
			</VStack>
		</Box>
	);
};

const App = () => {
	return (
		<NativeBaseProvider>
			<WalletConnectProviderWrapper
				clientMeta={{
					description: "Example Description",
					url: "https://example.org",
					name: "Example",
				}}
				storageOptions={{
					asyncStorage: AsyncStorage,
				}}
			>
				<HomePage />
			</WalletConnectProviderWrapper>
		</NativeBaseProvider>
	);
};

export default App;
