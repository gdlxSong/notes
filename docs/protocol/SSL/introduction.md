---
title: 简介
sidebar_position: 1
---


需要申明一点，无论是 SSH 还是 SSL 所谓的增加安全性，指代的是增加 数据传输 的安全性。

> openssl tutorial: https://www.openssl.net.cn/



### 对称加密

对称算法使用一个密钥。给定一个明文和一个密钥，加密产生密文，其长度和明文大致相同。解密时，使用读密钥与加密密钥相同。

对称加密存在四种模式：

- ECB：电子密码本模式（Electronic Code Book）
- CBC：加密块链模式（Cipher Block Chaining）
- CFB：加密反馈模式（Cipher Feedback Mode）

> note: [加密算法详细细节请查看](https://www.openssl.net.cn/docs/1.html)


### 摘要算法

摘要算法是一种能产生特殊输出格式的算法，这种算法的特点是：无论用户输入什么长度的原始数据，经过计算后输出的密文都是固定长度的，这种算法的原理是根据一定的运算规则对原数据进行某种形式的提取，这种提取就是摘要，被摘要的数据内容与原数据有密切联系，只要原数据稍有改变，输出的“摘要”便完全不同，因此，基于这种原理的算法便能对数据完整性提供较为健全的保障。但是，由于输出的密文是提取原数据经过处理的定长值，所以它已经不能还原为原数据，即消息摘要算法是不可逆的，理论上无法通过反向运算取得原数据内容，因此它通常只能被用来做数据完整性验证。如 MD2、MD4、MD5、SHA、SHA-1/256/383/512。


### 公钥算法

在公钥密码系统中，加密和解密使用的是不同的密钥，这两个密钥之间存在着相互依存关系：即用其中任一个密钥加密的信息只能用另一个密钥进行解密。这使得通信双方无需事先交换密钥就可进行保密通信。其中加密密钥和算法是对外公开的，人人都可以通过这个密钥加密文件然后发给收信者，这个加密密钥又称为公钥；而收信者收到加密文件后,它可以使用他的解密密钥解密，这个密钥是由他自己私人掌管的，并不需要分发，因此又成称为私钥，这就解决了密钥分发的问题。

主要的公钥算法有：RSA、DSA、DH和ECC。

- RSA: RSA算法是R.Rivest、A.Shamir和L.Adleman于1977年在美国麻省理工学院开发，于1978年首次公布。RSA算法是第一个既能用于数据加密也能用于数字签名的算法，因此它为公用网络上信息的加密和鉴别提供了一种基本的方法。RSA公钥密码算法是目前网络上进行保密通信和数字签名的最有效的安全算法之一。RSA算法的安全性基于数论中大素数分解的困难性，所以，RSA需采用足够大的整数。因子分解越困难，密码就越难以破译，加密强度就越高。

    [算法细节参考](https://zhuanlan.zhihu.com/p/48249182)

- DSA: DSA（Digital Signature Algorithm，数字签名算法，用作数字签名标准的一部分），它是另一种公开密钥算法，它不能用作加密，只用作数字签名。DSA使用公开密钥，为接受者验证数据的完整性和数据发送者的身份。它也可用于由第三方去确定签名和所签数据的真实性。DSA算法的安全性基于解离散对数的困难性，这类签字标准具有较大的兼容性和适用性，成为网络安全体系的基本构件之一。 
    ![ssl_dsa___](/images/ssl_dsa___.jpg)

    [算法细节参考](https://zhuanlan.zhihu.com/p/347025157)
    > note: DSA（用于数字签名算法）的签名生成速度很快，验证速度很慢，加密时更慢，但解密时速度很快，安全性与RSA密钥相等，而密钥长度相等。

- DH: Diffie-Hellman, DH算法是W.Diffie和M.Hellman提出的。此算法是最早的公钥算法。它实质是一个通信双方进行密钥协定的协议：两个实体中的任何一个使用自己的私钥和另一实体的公钥，得到一个对称密钥，这一对称密钥其它实体都计算不出来。DH算法的安全性基于有限域上计算离散对数的困难性。离散对数的研究现状表明：所使用的DH密钥至少需要1024位，才能保证有足够的中、长期安全。

    [算法细节参考](https://www.liaoxuefeng.com/wiki/1252599548343744/1304227905273889#:~:text=DH%E7%AE%97%E6%B3%95%E6%98%AF%E4%B8%80%E7%A7%8D%E5%AF%86,%E8%A1%8C%E5%AF%B9%E7%A7%B0%E5%8A%A0%E5%AF%86%E4%BC%A0%E8%BE%93%E3%80%82)


- ECC: 椭圆曲线密码体制, 1985年，N. Koblitz和V. Miller分别独立提出了椭圆曲线密码体制(ECC)，其依据就是定义在椭圆曲线点群上的离散对数问题的难解性。同样密钥长度下，ECC比RSA安全得多(?)。在区块链领域广泛使用。




### 证书 Certificate

证书由 证书权威机构(CA) 签发，证书中包含版本号，使用者，颁发机构信息，加密算法，网站公钥等信息，用以用户甄别网站身份信息。

> 使用 openssl 等工具也可以自己签发证书，然后将根证书设置到本地受信 CA 就ok。

证书的种类可以分为：域名型SSL证书（DV），企业型SSL证书（OV），增强型SSL证书（EV），[详细信息请参考](https://zhuanlan.zhihu.com/p/34753269)。






### 存疑

1.  DSA 为什么不能用作加密？
DSA（用于数字签名算法）的签名生成速度很快，验证速度很慢，加密时更慢，但解密时速度很快，安全性与RSA密钥相等，而密钥长度相等。












