import React, { Component } from 'react';
import {
  Text,
  Button,
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform,
  ToolbarAndroid,
  TouchableHighlight
} from 'react-native';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import Icon from 'react-native-vector-icons/FontAwesome';

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

  onActionSelected(position) {}

  render() {
    const { location, message, connected, log } = this.state;
    return (
      <View style={styles.MainContainer}>
        <ToolbarAndroid
          style={styles.toolbar}
          onActionSelected={this.onActionSelected}
          title="WebSocket Tester"
          actions={[{ title: 'Settings', show: 'always' }]}
        />
        {!connected && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputStyle}
              value={location}
              onChangeText={location => this.setState({ location })}
              onSubmitEditing={this.connect}
            />
            <TouchableHighlight onPress={this.connect} underlayColor="white">
              <Icon
                name="check"
                size={20}
                color="#0A0A0A"
                style={styles.inputIconStyle}
              />
            </TouchableHighlight>
          </View>
        )}
        {connected && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputStyle}
              value={location}
              onChangeText={location => this.setState({ location })}
              onSubmitEditing={this.connect}
            />
            <TouchableHighlight
              onPress={this.disconnect}
              underlayColor="hsl(0, 0%, 98%)"
            >
              <Icon
                name="times"
                size={20}
                color="hsl(348, 100%, 61%)"
                style={styles.inputIconStyle}
              />
            </TouchableHighlight>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.inputStyle}
            value={message}
            onChangeText={message => this.setState({ message })}
            onSubmitEditing={this.send}
          />
          <TouchableHighlight
            onPress={this.send}
            underlayColor="hsl(0, 0%, 98%)"
          >
            <Icon
              style={styles.inputIconStyle}
              name="paper-plane"
              size={20}
              color="#0A0A0A"
            />
          </TouchableHighlight>
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
                      color: 'hsl(14, 100%, 53%)',
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
                      color: 'hsl(0, 0%, 4%)',
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
                      color: 'hsl(14, 100%, 53%)',
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
                    {{ color: 'hsl(0, 0%, 4%)', fontFamily: monospaceFont }}>
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
  MainContainer: {
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
    paddingLeft: '2%',
    paddingRight: '2%'
  },
  toolbar: {
    backgroundColor: '#F5F5F5',
    height: 56,
    top: 0,
    alignSelf: 'stretch',
    textAlign: 'center',
    color: '#F5F5F5'
  },
  textStyle: {
    color: '#fff',
    fontSize: 22
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    width: '100%'
  },
  inputStyle: {
    flex: 1
  },
  inputIconStyle: {
    padding: 10
  }
});
