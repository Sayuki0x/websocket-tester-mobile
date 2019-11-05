import React, { Component } from 'react';
import {
  Container,
  Header,
  Title,
  Footer,
  FooterTab,
  Button,
  Left,
  Right,
  Body,
  Icon,
  Text,
  Item,
  Input,
  Toast,
  Content,
  Root as NativeRoot
} from 'native-base';
import {
  KeyboardAvoidingView,
  TouchableHighlight,
  View,
  Platform,
  ScrollView,
  StyleSheet,
  Clipboard
} from 'react-native';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import Menu, { MenuItem, MenuDivider } from 'react-native-material-menu';

const monospaceFont = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

type Props = {};

type State = {
  location: string;
  message: string;
  connected: boolean;
  connectionInProgress: boolean;
  log: any[];
  selectedLine: any;
  touchX: number;
  touchY: number;
};

export default class Root extends Component<Props, State> {
  state: State;
  client: W3CWebSocket;
  scrollView: any;
  menu: any;

  constructor(props: Props) {
    super(props);

    this.state = {
      location: 'ws://echo.websocket.org',
      message: '',
      connected: false,
      connectionInProgress: false,
      log: [],
      selectedLine: {},
      touchX: 0,
      touchY: 0
    };

    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.send = this.send.bind(this);
    this.initListeners = this.initListeners.bind(this);
    this.log = this.log.bind(this);
    this.handleLogLongPress = this.handleLogLongPress.bind(this);
    this.setMenuRef = this.setMenuRef.bind(this);
    this.copySelected = this.copySelected.bind(this);
    this.saveSelected = this.saveSelected.bind(this);
  }

  connect() {
    this.setState({
      connectionInProgress: true
    });

    const { location, connected } = this.state;

    if (connected) {
      return;
    }

    console.log(`connect to: ${location}`);

    this.client = new W3CWebSocket(location);
    this.initListeners();
  }

  hideMenu = () => {
    this.menu.hide();
  };

  showMenu = () => {
    // we need to add a small timeout to menu.show
    // so that the touch coordinates update
    setTimeout(this.menu.show, 10);
  };

  initListeners() {
    this.client.onopen = () => {
      const { location } = this.state;
      console.log('Connected to websocket');
      this.setState({
        connected: true,
        connectionInProgress: false
      });
      Toast.show({
        text: `Connected to ${location}`,
        buttonText: 'Okay',
        duration: 2000,
        type: 'success',
        position: 'top'
      });
    };
    this.client.onmessage = (message: { data: any }) => {
      const { data } = message;
      console.log(`incoming message: ${data}`);
      this.log('in', data);
    };
    this.client.onerror = () => {
      this.setState({
        connectionInProgress: false
      });
      console.log('error occurred');
      Toast.show({
        text: 'An error occurred connecting to the websocket.',
        buttonText: 'Okay',
        duration: 2000,
        type: 'danger',
        position: 'top'
      });
    };
    this.client.onclose = () => {
      const { location } = this.state;
      console.log('connection closed');
      this.setState({
        connected: false
      });
      Toast.show({
        text: `Disconnected from ${location}`,
        buttonText: 'Okay',
        duration: 2000,
        type: 'warning',
        position: 'top'
      });
    };
  }

  log(type: string, data: string) {
    const { log } = this.state;
    log.push({ type, data });

    this.setState({
      log
    });
  }

  setMenuRef = (ref: any) => {
    this.menu = ref;
  };

  disconnect() {
    console.log('disconnect');

    const { connected } = this.state;

    if (!connected) {
      return;
    }

    this.client.close();
  }

  send(event: any) {
    event.preventDefault();

    const { message, connected } = this.state;

    if (!connected) {
      Toast.show({
        text: 'Connect to a websocket first!',
        buttonText: 'Okay',
        duration: 2000,
        type: 'warning',
        position: 'top'
      });
      return;
    }

    if (message.trim() === '') {
      return;
    }

    console.log(`send message: ${message}`);
    this.client.send(message);
    this.log('out', message);

    this.setState({
      message: ''
    });
  }

  handleLogLongPress = (event: any, selectedLine: any) => {
    this.setState(
      {
        selectedLine,
        touchX: event.nativeEvent.pageX,
        touchY: event.nativeEvent.pageY
      },
      () => {
        this.showMenu();
        console.log(this.state.touchX, this.state.touchY);
      }
    );
  };

  saveSelected() {
    const { selectedLine } = this.state;
    const { data } = selectedLine;
    console.log(`Saving ${data} as a command. {TODO}`);
    this.menu.hide();
  }

  copySelected() {
    const { selectedLine } = this.state;
    const { data } = selectedLine;

    let isValidJSON: boolean;
    let jsonMessage: any;

    try {
      jsonMessage = JSON.parse(data);
      isValidJSON = true;
    } catch (error) {
      isValidJSON = false;
    }

    Clipboard.setString(
      isValidJSON ? JSON.stringify(jsonMessage, null, 2) : data
    );
    this.menu.hide();
  }

  render() {
    const {
      location,
      message,
      connected,
      connectionInProgress,
      log,
      touchX,
      touchY
    } = this.state;

    return (
      <NativeRoot>
        <Container style={styles.container}>
          <Header style={styles.header}>
            <Left>
              <Button transparent>
                <Icon name="menu" />
              </Button>
            </Left>
            <Body>
              <Title>WebSocket Tester</Title>
            </Body>
            <Right />
          </Header>
          <KeyboardAvoidingView behavior="padding" style={styles.rootContainer}>
            <ScrollView
              ref={ref => (this.scrollView = ref)}
              onContentSizeChange={() => this.scrollView.scrollToEnd()}
              style={styles.scrollView}
              stickyHeaderIndices={[0]}
              contentContainerStyle={{ justifyContent: 'flex-end' }}
            >
              <View style={styles.urlBar}>
                <Item>
                  <Input
                    value={location}
                    onSubmitEditing={this.connect}
                    onChangeText={location => this.setState({ location })}
                    style={styles.input}
                  />

                  {connected ? (
                    <TouchableHighlight
                      onPress={this.disconnect}
                      underlayColor="hsl(0, 0%, 7%)"
                    >
                      <Text style={styles.link}>Disconnect</Text>
                    </TouchableHighlight>
                  ) : !connectionInProgress ? (
                    <TouchableHighlight
                      onPress={this.connect}
                      underlayColor="hsl(0, 0%, 7%)"
                    >
                      <Text style={styles.link}>Connect</Text>
                    </TouchableHighlight>
                  ) : (
                    <Text style={styles.link}>Connecting...</Text>
                  )}
                </Item>
              </View>
              <View style={styles.console}>
                {log.map((line, index) => {
                  const { type, data } = line;

                  const logStyle =
                    index % 2 == 0 ? styles.logEven : styles.logOdd;

                  const underlayColor =
                    index % 2 == 0 ? 'hsl(0, 0%, 13%)' : 'hsl(0, 0%, 9%)';

                  let isValidJSON: boolean;
                  let jsonMessage: any;

                  try {
                    jsonMessage = JSON.parse(data);
                    isValidJSON = true;
                  } catch (error) {
                    isValidJSON = false;
                  }

                  switch (type) {
                    case 'system':
                      return (
                        <View style={logStyle} key={index}>
                          <Text style={styles.systemLog}>{data}</Text>
                        </View>
                      );
                    case 'out':
                      return (
                        <TouchableHighlight
                          key={index}
                          underlayColor={underlayColor}
                          onLongPress={event => {
                            this.handleLogLongPress(event, log[index]);
                          }}
                        >
                          <View style={logStyle}>
                            <Text style={styles.outLog}>
                              {isValidJSON
                                ? JSON.stringify(jsonMessage, null, 2)
                                : data}
                            </Text>
                          </View>
                        </TouchableHighlight>
                      );
                    case 'in':
                      return (
                        <TouchableHighlight
                          key={index}
                          underlayColor={underlayColor}
                          onLongPress={event => {
                            this.handleLogLongPress(event, log[index]);
                          }}
                        >
                          <View style={logStyle}>
                            <Text style={styles.inLog}>
                              {isValidJSON
                                ? JSON.stringify(jsonMessage, null, 2)
                                : data}
                            </Text>
                          </View>
                        </TouchableHighlight>
                      );
                    case 'warning':
                      return (
                        <View style={logStyle} key={index}>
                          <Text style={styles.warningLog}>{data}</Text>
                        </View>
                      );
                    case 'error':
                      return (
                        <View style={logStyle} key={index}>
                          <Text style={styles.errorLog}>{data}</Text>
                        </View>
                      );
                    default:
                      return (
                        <View style={logStyle} key={index}>
                          <Text style={styles.defaultLog}>{data}</Text>
                        </View>
                      );
                  }
                })}
              </View>
            </ScrollView>
            <View style={{ position: 'absolute', top: touchY, left: touchX }}>
              <Menu ref={this.setMenuRef} button={<Text />} style={styles.menu}>
                <MenuItem onPress={this.copySelected}>
                  <Text style={styles.menuText}>Copy to Clipboard</Text>
                </MenuItem>
                <MenuItem onPress={this.saveSelected}>
                  <Text style={styles.menuText}>Save Query</Text>
                </MenuItem>
              </Menu>
            </View>

            <Footer>
              <FooterTab style={styles.footer}>
                <Input
                  placeholder="Enter Message"
                  value={message}
                  onChangeText={message => this.setState({ message })}
                  onSubmitEditing={this.send}
                  style={styles.input}
                />
              </FooterTab>
            </Footer>
          </KeyboardAvoidingView>
        </Container>
      </NativeRoot>
    );
  }
}

const consoleFontSize = 17;

const styles = StyleSheet.create({
  rootContainer: { flex: 1 },
  container: { backgroundColor: 'hsl(0, 0%, 14%)' },
  header: {
    paddingTop: getStatusBarHeight(),
    height: 54 + getStatusBarHeight(),
    backgroundColor: 'hsl(0, 0%, 4%)'
  },
  urlBar: { backgroundColor: 'hsl(0, 0%, 7%)' },
  scrollView: { flex: 1 },
  input: { color: 'hsl(0, 0%, 98%)' },
  link: { color: 'hsl(171, 100%, 41%)', paddingRight: '2%' },
  console: {},
  systemLog: {
    color: 'hsl(0, 0%, 67%)',
    fontFamily: monospaceFont,
    fontSize: consoleFontSize
  },
  outLog: {
    color: 'hsl(14, 100%, 53%)',
    fontFamily: monospaceFont,
    fontSize: consoleFontSize
  },
  inLog: {
    color: 'hsl(0, 0%, 98%)',
    fontFamily: monospaceFont,
    fontSize: consoleFontSize
  },
  warningLog: {
    color: 'hsl(48, 100%, 67%)',
    fontFamily: monospaceFont,
    fontSize: consoleFontSize
  },
  errorLog: {
    color: 'hsl(348, 100%, 61%)',
    fontFamily: monospaceFont,
    fontSize: consoleFontSize
  },
  defaultLog: {
    color: 'hsl(0, 0%, 4%)',
    fontFamily: monospaceFont,
    fontSize: consoleFontSize
  },
  logEven: {
    paddingTop: 1,
    paddingBottom: 1,
    paddingLeft: '2%',
    paddingRight: '2%'
  },
  logOdd: {
    paddingTop: 1,
    paddingBottom: 1,
    backgroundColor: 'hsl(0, 0%, 11%)',
    paddingLeft: '2%',
    paddingRight: '2%'
  },
  menuText: {
    color: 'hsl(0, 0%, 98%)'
  },
  footer: { backgroundColor: 'hsl(0, 0%, 7%)' },
  menu: { backgroundColor: 'hsl(0, 0%, 4%)' }
});
