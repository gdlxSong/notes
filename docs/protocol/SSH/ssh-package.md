---
title: go-ssh-package
sidebar_position: 12
---


> docs: https://pkg.go.dev/golang.org/x/crypto/ssh#pkg-overview

Package ssh implements an SSH client and server.

> SSH is a transport security protocol, an authentication protocol and a family of application protocols. The most typical application level protocol is a remote shell and this is specifically implemented. However, the multiplexed nature of SSH is exposed to users that wish to support others.




### ClientConfig


```go
// Config contains configuration data common to both ServerConfig and
// ClientConfig.
type Config struct {
	// Rand provides the source of entropy for cryptographic
	// primitives. If Rand is nil, the cryptographic random reader
	// in package crypto/rand will be used.
	Rand io.Reader

	// The maximum number of bytes sent or received after which a
	// new key is negotiated. It must be at least 256. If
	// unspecified, a size suitable for the chosen cipher is used.
	RekeyThreshold uint64

	// The allowed key exchanges algorithms. If unspecified then a
	// default set of algorithms is used.
	KeyExchanges []string

	// The allowed cipher algorithms. If unspecified then a sensible
	// default is used.
	Ciphers []string

	// The allowed MAC algorithms. If unspecified then a sensible default
	// is used.
	MACs []string
}


// A ClientConfig structure is used to configure a Client. It must not be
// modified after having been passed to an SSH function.
type ClientConfig struct {
	// Config contains configuration that is shared between clients and
	// servers.
	Config

	// User contains the username to authenticate as.
	User string

	// Auth contains possible authentication methods to use with the
	// server. Only the first instance of a particular RFC 4252 method will
	// be used during authentication.
	Auth []AuthMethod

    // validate ~/.ssh/known_hosts
    // golang.org/x/crypto/ssh/knownhosts 子包提供了校验能力.
	// HostKeyCallback is called during the cryptographic
	// handshake to validate the server's host key. The client
	// configuration must supply this callback for the connection
	// to succeed. The functions InsecureIgnoreHostKey or
	// FixedHostKey can be used for simplistic host key checks.
	HostKeyCallback HostKeyCallback

    // ??????????????????????????????
	// BannerCallback is called during the SSH dance to display a custom
	// server's message. The client configuration can supply this callback to
	// handle it as wished. The function BannerDisplayStderr can be used for
	// simplistic display on Stderr.
	BannerCallback BannerCallback

	// ClientVersion contains the version identification string that will
	// be used for the connection. If empty, a reasonable default is used.
	ClientVersion string

	// HostKeyAlgorithms lists the public key algorithms that the client will
	// accept from the server for host key authentication, in order of
	// preference. If empty, a reasonable default is used. Any
	// string returned from a PublicKey.Type method may be used, or
	// any of the CertAlgo and KeyAlgo constants.
	HostKeyAlgorithms []string

	// Timeout is the maximum amount of time for the TCP connection to establish.
	//
	// A Timeout of zero means no timeout.
	Timeout time.Duration
}
```


## ssh::Client

```go
// 连接 ssh server.
func Dial(network, addr string, config *ClientConfig) (*Client, error)
func NewClient(c Conn, chans <-chan NewChannel, reqs <-chan *Request) *Client
func (c *Client) Dial(n, addr string) (net.Conn, error)
func (c *Client) DialTCP(n string, laddr, raddr *net.TCPAddr) (net.Conn, error)
func (c *Client) HandleChannelOpen(channelType string) <-chan NewChannel
// 通过 Client 连接的 ssh-server 在 ssh-server 主机上开一个 tcp/tcp4/tcp6/unix 代理.
func (c *Client) Listen(n, addr string) (net.Listener, error)
func (c *Client) ListenTCP(laddr *net.TCPAddr) (net.Listener, error)
func (c *Client) ListenUnix(socketPath string) (net.Listener, error)
// NewSession opens a new Session for this client. (A session is a remote execution of a program.)
// Client 发起会话请求，创建 Session 实例.
func (c *Client) NewSession() (*Session, error)
```



### go ssh client demo

使用 ssh 和 knownhosts 两个库实现简单的 ssh 登录。


```go
package main

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"log"

	gossh "golang.org/x/crypto/ssh"
	"golang.org/x/crypto/ssh/knownhosts"
)

func main() {
	var user = "root"
	// var hostKey gossh.PublicKey
	// A public key may be used to authenticate against the remote
	// server by using an unencrypted PEM-encoded private key file.
	//
	// If you have an encrypted private key, the crypto/x509 package
	// can be used to decrypt it.
	key, err := ioutil.ReadFile("c://Users/Tomas/.ssh/id_rsa")
	if err != nil {
		log.Fatalf("unable to read private key: %v", err)
	}

	// Create the Signer for this private key.
	signer, err := gossh.ParsePrivateKey(key)
	if err != nil {
		log.Fatalf("unable to parse private key: %v", err)
	}

	hostKeys, err := knownhosts.New("c://Users/Tomas/.ssh/known_hosts")
	if nil != err {
		log.Fatalf("check kenown hosts, %v", err)
	}

	config := &gossh.ClientConfig{
		User: user,
		Auth: []gossh.AuthMethod{
			// Use the PublicKeys method for remote authentication.
			gossh.PublicKeys(signer),
		},
		HostKeyCallback: hostKeys,
	}

	// Connect to the remote server and perform the SSH handshake.
	client, err := gossh.Dial("tcp", "39.103.128.226:22", config)
	if err != nil {
		log.Fatalf("unable to connect: %v", err)
	}
	defer client.Close()

	// new session from client.
	session, err := client.NewSession()
	if nil != err {
		log.Fatalf("new session instance failed, %v", err)
	}
	defer session.Close()

	var outBuf bytes.Buffer
	session.Stdout = &outBuf
	if err = session.Run("ps -aux"); nil != err {
		log.Fatalf("exec shell failed, %v", err)
	}

	fmt.Println("$ ps -aux", outBuf.String())
}
```




### parse privatekey

通过 `gossh.ParsePrivateKey` 函数解析 privatekey。

```go
	key, err := ioutil.ReadFile("c://Users/Tomas/.ssh/id_rsa")
	if err != nil {
		log.Fatalf("unable to read private key: %v", err)
	}

	// Create the Signer for this private key.
	signer, err := gossh.ParsePrivateKey(key)
	if err != nil {
		log.Fatalf("unable to parse private key: %v", err)
	}
```


### 使用 Session::Listen 实现远程代理

建立本地与远程ssh-server 的 ssh 连接Client，调用Client的Listen*方法在ssh-server主机上创建tcp/unix代理服务。


```go
package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"

	gossh "golang.org/x/crypto/ssh"
)

func main() {
	var user = "root"
	// var hostKey gossh.PublicKey
	// A public key may be used to authenticate against the remote
	// server by using an unencrypted PEM-encoded private key file.
	//
	// If you have an encrypted private key, the crypto/x509 package
	// can be used to decrypt it.
	key, err := ioutil.ReadFile("/root/.ssh/id_rsa")
	if err != nil {
		log.Fatalf("unable to read private key: %v", err)
	}

	// Create the Signer for this private key.
	signer, err := gossh.ParsePrivateKey(key)
	if err != nil {
		log.Fatalf("unable to parse private key: %v", err)
	}

	config := &gossh.ClientConfig{
		User: user,
		Auth: []gossh.AuthMethod{
			// Use the PublicKeys method for remote authentication.
			gossh.PublicKeys(signer),
		},
		HostKeyCallback: gossh.InsecureIgnoreHostKey(),
	}

	// Connect to the remote server and perform the SSH handshake.
	client, err := gossh.Dial("tcp", "39.103.128.226:22", config)
	if err != nil {
		log.Fatalf("unable to connect: %v", err)
	}
	defer client.Close()

	// listen peer.
	l, err := client.Listen("tcp", "0.0.0.0:8889")
	if nil != err {
		log.Fatalf("listen failed, %v", err)
	}

	defer l.Close()

	fmt.Println("Serve HTTP with your SSH server acting as a reverse proxy.")
	// Serve HTTP with your SSH server acting as a reverse proxy.
	http.Serve(l, http.HandlerFunc(func(resp http.ResponseWriter, req *http.Request) {
		fmt.Fprintf(resp, "Hello world!\n")
	}))
}
```



## ssh::Session

```golang
func (s *Session) Close() error
// CombinedOutput runs cmd on the remote host and returns its combined standard output and standard error.
func (s *Session) CombinedOutput(cmd string) ([]byte, error)
// Output runs cmd on the remote host and returns its standard output.
func (s *Session) Output(cmd string) ([]byte, error)        
// pty: linux 系统中的伪终端.
// 使用 RequestPty 在 ssh-server 主机创建一个 pty.
func (s *Session) RequestPty(term string, h, w int, termmodes TerminalModes) error
func (s *Session) RequestSubsystem(subsystem string) error
// Run 将 cmd 在远程 ssh-server 主机执行.
// Run runs cmd on the remote host. Typically, the remote server passes cmd to the shell for interpretation. A Session only accepts one call to Run, Start, Shell, Output, or CombinedOutput. 命令通过 shell 解释器执行.
func (s *Session) Run(cmd string) error
// SendRequest sends an out-of-band channel request on the SSH channel underlying the session.
// ????
func (s *Session) SendRequest(name string, wantReply bool, payload []byte) (bool, error)
// Setenv sets an environment variable that will be applied to any command executed by Shell or Run.
func (s *Session) Setenv(name, value string) error
// Shell starts a login shell on the remote host. A Session only accepts one call to Run, Start, Shell, Output, or CombinedOutput.
func (s *Session) Shell() error
// Signal sends the given signal to the remote process. sig is one of the SIG* constants.
func (s *Session) Signal(sig Signal) error
// Start runs cmd on the remote host. Typically, the remote server passes cmd to the shell for interpretation. A Session only accepts one call to Run, Start or Shell.
func (s *Session) Start(cmd string) error
func (s *Session) StderrPipe() (io.Reader, error)
func (s *Session) StdinPipe() (io.WriteCloser, error)
func (s *Session) StdoutPipe() (io.Reader, error)
// Wait 和 Shell 结合使用.
// Wait waits for the remote command to exit.
func (s *Session) Wait() error
// WindowChange informs the remote host about a terminal window dimension change to h rows and w columns.
func (s *Session) WindowChange(h, w int) error
```


### 使用 Session::Shell 实现 ssh 终端.

```go
package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"

	gossh "golang.org/x/crypto/ssh"
)

func main() {
	var user = "root"
	// var hostKey gossh.PublicKey
	// A public key may be used to authenticate against the remote
	// server by using an unencrypted PEM-encoded private key file.
	//
	// If you have an encrypted private key, the crypto/x509 package
	// can be used to decrypt it.
	key, err := ioutil.ReadFile("/root/.ssh/id_rsa")
	if err != nil {
		log.Fatalf("unable to read private key: %v", err)
	}

	// Create the Signer for this private key.
	signer, err := gossh.ParsePrivateKey(key)
	if err != nil {
		log.Fatalf("unable to parse private key: %v", err)
	}

	config := &gossh.ClientConfig{
		User: user,
		Auth: []gossh.AuthMethod{
			// Use the PublicKeys method for remote authentication.
			gossh.PublicKeys(signer),
		},
		HostKeyCallback: gossh.InsecureIgnoreHostKey(),
	}

	// Connect to the remote server and perform the SSH handshake.
	client, err := gossh.Dial("tcp", "39.103.128.226:22", config)
	if err != nil {
		log.Fatalf("unable to connect: %v", err)
	}
	defer client.Close()

	// new session from client.
	session, err := client.NewSession()
	if nil != err {
		log.Fatalf("new session instance failed, %v", err)
	}
	defer session.Close()

    // redirect input & output.
	session.Stdin = os.Stdin
	session.Stdout = os.Stdout
	session.Stderr = os.Stderr
	// Set up terminal modes
	modes := gossh.TerminalModes{
		gossh.ECHO:          0,     // disable echoing
		gossh.TTY_OP_ISPEED: 14400, // input speed = 14.4kbaud
		gossh.TTY_OP_OSPEED: 14400, // output speed = 14.4kbaud
	}
	// Request pseudo terminal
	if err := session.RequestPty("xterm", 40, 80, modes); err != nil {
		log.Fatal("request for pseudo terminal failed: ", err)
	}

	fmt.Println("Start remote shell.")
	// Start remote shell
	if err := session.Shell(); err != nil {
		log.Fatal("failed to start shell: ", err)
	}

	session.Wait()
	fmt.Println("Exit remote shell.")
}
```

## ssh::Channel

```go
type Channel interface {
	// Read reads up to len(data) bytes from the channel.
	Read(data []byte) (int, error)

	// Write writes len(data) bytes to the channel.
	Write(data []byte) (int, error)

	// Close signals end of channel use. No data may be sent after this
	// call.
	Close() error

	// CloseWrite signals the end of sending in-band
	// data. Requests may still be sent, and the other side may
	// still send data
	CloseWrite() error

	// SendRequest sends a channel request.  If wantReply is true,
	// it will wait for a reply and return the result as a
	// boolean, otherwise the return value will be false. Channel
	// requests are out-of-band messages so they may be sent even
	// if the data stream is closed or blocked by flow control.
	// If the channel is closed before a reply is returned, io.EOF
	// is returned.
	SendRequest(name string, wantReply bool, payload []byte) (bool, error)

	// Stderr returns an io.ReadWriter that writes to this channel
	// with the extended data type set to stderr. Stderr may
	// safely be read and written from a different goroutine than
	// Read and Write respectively.
	Stderr() io.ReadWriter
}
```










## 存疑

1. Session::RequestPty 请求 pty 虚拟终端，那么 直接 Session::Run, Session::Start 不会在 ssh-server 主机创建 pty 吗？

2. Session::Run 和 Session::Start 有什么区别？


















