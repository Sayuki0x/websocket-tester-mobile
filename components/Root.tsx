import React, { Component } from 'react';
import {
  Text,
  Button,
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform
} from 'react-native';
import { textInput } from '../styles/styles';
import { w3cwebsocket as W3CWebSocket } from 'websocket';

const monospaceFont = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

type State = {
  location: string;
  message: string;
  connected: boolean;
  log: any[];
};

export default class Root extends Component {
  state: State;

  client: W3CWebSocket;

  scrollView: any;

  constructor(props: any) {
    super(props);

    this.state = {
      location: 'ws://echo.websocket.org',
      message: '',
      connected: false,
      log: []
    };

    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.send = this.send.bind(this);
    this.initListeners = this.initListeners.bind(this);
    this.log = this.log.bind(this);
  }

  connect() {
    const { location, connected } = this.state;

    if (connected) {
      return;
    }

    console.log(`connect to: ${location}`);

    this.client = new W3CWebSocket(location);
    this.initListeners();
  }

  initListeners() {
    this.client.onopen = () => {
      const { location } = this.state;
      console.log('Connected to websocket');
      this.setState({
        connected: true
      });
      this.log('system', `Connected to ${location}`);
    };
    this.client.onmessage = message => {
      const { data } = message;
      console.log(`incoming message: ${data}`);
      this.log('in', data);
    };
    this.client.onerror = () => {
      console.log('error occurred');
      this.log('error', 'An error occurred while connecting to the websocket.');
    };
    this.client.onclose = () => {
      const { location } = this.state;
      console.log('connection closed');
      this.setState({
        connected: false
      });
      this.log('system', `Disconnected from ${location}`);
    };
  }

  log(type: string, data: string) {
    const { log } = this.state;
    log.push({ type, data });

    this.setState({
      log
    });
  }

  disconnect() {
    console.log('disconnect');

    const { connected } = this.state;

    if (!connected) {
      return;
    }

    this.client.close();
  }

  send() {
    const { message, connected } = this.state;

    if (!connected) {
      this.log('system', 'Connect to a websocket first!');
      return;
    }

    console.log(`send message: ${message}`);
    this.client.send(message);
    this.log('out', message);
  }

  render() {
    const { location, message, connected, log } = this.state;
    return (
      <View>
        <Text>Location:</Text>
        <TextInput
          style={textInput}
          value={location}
          onChangeText={location => this.setState({ location })}
          onSubmitEditing={this.connect}
        />
        <View style={styles.fixToText}>
          {!connected && <Button title="Connect" onPress={this.connect} />}
          {connected && <Button title="Disconnect" onPress={this.disconnect} />}
        </View>
        <Text>Connected: {String(connected)}</Text>
        <Text>Message:</Text>
        <TextInput
          style={textInput}
          value={message}
          onChangeText={message => this.setState({ message })}
          onSubmitEditing={this.send}
        />
        <View style={styles.fixToText}>
          <Button title="Send" onPress={this.send} />
        </View>

        <ScrollView
          ref={ref => (this.scrollView = ref)}
          onContentSizeChange={(contentWidth, contentHeight) => {
            this.scrollView.scrollToEnd({ animated: true });
          }}
          style={styles.console}
        >
          {log.map((line, index) => {
            const { type, data } = line;

            switch (type) {
              case 'system':
                return (
                  <Text
                    key={index}
                    style={{
                      color: 'hsl(204, 71%, 53%)',
                      fontFamily: monospaceFont
                    }}
                  >
                    {data}
                  </Text>
                );
              case 'out':
                return (
                  <Text
                    key={index}
                    style={{
                      color: 'hsl(48, 100%, 67%)',
                      fontFamily: monospaceFont
                    }}
                  >
                    {data}
                  </Text>
                );
              case 'in':
                return (
                  <Text
                    key={index}
                    style={{
                      color: 'hsl(0, 0%, 100%)',
                      fontFamily: monospaceFont
                    }}
                  >
                    {data}
                  </Text>
                );
              case 'error':
                return (
                  <Text
                    key={index}
                    style={{
                      color: 'hsl(348, 100%, 61%)',
                      fontFamily: monospaceFont
                    }}
                  >
                    {data}
                  </Text>
                );
              default:
                return (
                  <Text key={index}>
                    {data} style=
                    {{ color: 'hsl(0, 0%, 100%)', fontFamily: monospaceFont }}>
                  </Text>
                );
            }
          })}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  console: {
    height: '40%',
    backgroundColor: '#0A0A0A',
    color: '#F5F5F5'
  }
});
