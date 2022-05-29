---
title: "Discrete Cosine Transform"
date: 2020-05-07T00:09:54+08:00
lastmod: 2020-05-07T00:09:54+08:00
description: ""
tags: ["数学", "算法", "DCT变换", "图像压缩"]
categories: ["算法"]
author: "xGdl"
comment: true
toc: true
autoCollapseToc: true
postMetaInFooter: false
hiddenFromHomePage: false
contentCopyright: true
reward: true
mathjax: true
mathjaxEnableSingleDollar: false
mathjaxEnableAutoNumber: false
---


## 简介

>&emsp;&emsp;DCT变换的全称是离散余弦变换(Discrete Cosine Transform)，主要用于将数据或图像的压缩，能够将空域的信号转换到频域上，具有良好的去相关性的性能。DCT变换本身是无损的，但是在图像编码等领域给接下来的量化、哈弗曼编码等创造了很好的条件，同时，由于DCT变换时对称的，所以，我们可以在量化编码后利用DCT反变换，在接收端恢复原始的图像信息。DCT变换在当前的图像分析已经压缩领域有着极为广大的用途，我们常见的JPEG静态图像编码以及MJPEG、MPEG动态编码等标准中都使用了DCT变换。


## 一维DCT变换

&emsp;&emsp;一维DCT变换时二维DCT变换的基础，所以我们先来讨论下一维DCT变换。一维DCT变换共有8种形式，其中最常用的是第二种形式，由于其运算简单、适用范围广。我们在这里只讨论这种形式，其表达式如下：

![](/images/dct00.png)

其中，f(i)为原始的信号，F(u)是DCT变换后的系数，N为原始信号的点数，c(u)可以认为是一个补偿系数，可以使DCT变换矩阵为正交矩阵。



## 二维DCT变换

&emsp;&emsp;二维DCT变换其实是在一维DCT变换的基础上在做了一次DCT变换，其公式如下：

![](/images/dct01.png)

&emsp;&emsp;由公式我们可以看出，上面只讨论了二维图像数据为方阵的情况，在实际应用中，如果不是方阵的数据一般都是补齐之后再做变换的，重构之后可以去掉补齐的部分，得到原始的图像信息，这个尝试一下，应该比较容易理解。

&emsp;&emsp;另外，由于DCT变换高度的对称性，在使用Matlab进行相关的运算时，我们可以使用更简单的矩阵处理方式：


![](/images/dct02.jpg)



## matlab实现dct变换

### matlab库函数支持

```bash
# 首先matlab库函数就是对dct变换是支持的
dct2就可以实现dct变换
```

### 简单实现二维的dct变换

```bash
clc;clear;
f = (rand(4,4)*100); % 生成4x4块
% 1，根据公式，生成转换矩阵A
for i=0:3
    for j=0:3
        if i == 0
            c = sqrt(1/4);
        else
            c = sqrt(2/4);
        end
        A(i+1, j+1) = c * cos( (j + 0.5)* pi * i / 4 ); % 生成转换矩阵
    end
end

% 2，利用转换矩阵A，进行转换
dct_my = A*f*A'; % 转换
dct_matlab = dct2(f); % matlab自带函数转换
```

### 简单实现二维的dct反变换

```bash
clc;clear;
f = (rand(4,4)*100)； % 生成4x4块
for i=0:3
    for j=0:3
        if i == 0
            c = sqrt(1/4);
        else
            c = sqrt(2/4);
        end
        A(i+1, j+1) = c * cos( (j + 0.5)* pi * i / 4 );
    end
end

dct_my = A*f*A'；
dct_matlab = dct2(f)；

f_convert = A'*dct_my*A；
```



### 以8x8的块划分进行dct变换

```bash
clc;clear;
img = rgb2gray(imread('./imag/lady.jpg'));
figure, imshow(img); 

% 1，使图像行列为 8的倍数
[row,col] = size(img);
row = round(row/8) * 8; 
col = round(col/8) * 8;
img = imresize(img, [row, col]);

% 2，对图像块进行dct变换
img_dct = zeros(row, col); % 存放转换后的dct系数
for i=1:8:row-7
    for j=1:8:col-7
        img_block = img(i:i+7, j:j+7);
        dct_block = dct2(img_block); % 也可用刚才实现的(定义成一个函数即可)
        % imshow(dct_block); % 显示dct块
        img_dct(i:i+7, j:j+7) = dct_block;
    end
end
figure, imshow(img_dct); % 显示生成的dct系数

% 简单量化
img_dct(abs(img_dct)<20) = 0;

% 3，dct反变换
new_img = zeros(row,col);
for i=1:8:row-7
    for j=1:8:col-7
        dct_block = img_dct(i:i+7, j:j+7);
        img_block = idct2(dct_block); % 也可用刚才实现的(定义成一个函数即可)
        new_img(i:i+7, j:j+7) = img_block;
    end
end
figure,  imshow(mat2gray(new_img)); % 显示反变换回来的图像
```


结果如下：

![](/images/dct03.jpg)



## 应用和原理

&emsp;&emsp;DCT变换技术广泛的应用于数字图像压缩的领域，其次DCT变换本身是无损的，DCT变换也是对称的，算法也是明确的，不依赖于概率参数（如EM）。DCT能够压缩的原因在于图像从时域到频域的变换，而人眼能够看到的，敏感的大多数是低频或者直流分量，而高频是不敏感的，从视觉效果来说是不敏感的，所以我们在对DCT系数矩阵做量化的时候可以将高频粗进度（大梯度）量化，对直流或低频细精度（小梯度）量化，并且图片中的高频分量都趋近于0，所以能达到压缩的目的。


## 参考

[0] https://blog.csdn.net/yanceyxin/article/details/82080242

[1] http://blog.sina.com.cn/s/blog_6de2e9fc0100t539.html

[2] https://blog.csdn.net/jizhidexiaoming/article/details/80826915