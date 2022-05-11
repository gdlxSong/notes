---
title: "c语言中的立定跳远"
---


首先是goto，就不多说了，原理也很简单。

然后来跳远一点~~

## 立定跳远

### setjmp函数

```bash
#include <setjmp.h>
int setjmp(jmp_buf env);

parameter：
    env必须是全局的。

RETURN VALUE
       setjmp() and sigsetjmp() return 0 if returning directly, and nonzero when returning from longjmp(3) or
       siglongjmp(3) using the saved context.
```


### longjmp函数

```bash
#include <setjmp.h>
void longjmp(jmp_buf env, int val);
void siglongjmp(sigjmp_buf env, int val);

RETURN VALUE
       These functions never return.
```


## 立定跳远的原理剖析

```c
#include <stdio.h>


typedef int jmp_buf[9]; // {0:ebx, 1:ecx, 2:edx, 3:esi, 4:edi, 5:esp, 6:ebp, 7:eflags, 8:ret}


jmp_buf jmpbuf;




__declspec(naked)
int setjmp(jmp_buf env) {
    __asm {
        push ebp
        mov ebp, esp
        sub esp, 0x40
        push esi
        push ebx


        mov eax, 0
        mov ebx, [ebp + 8] // env 基址


        mov [ebx], eax
        mov [ebx+4], ecx
        mov [ebx+8], edx
        mov [ebx+12], esi
        mov [ebx+16], edi


        // 提取 esp（指向 ret 返回地址）
        lea esi, [ebp+4]
        mov [ebx+20], esi


        // 提取真实 ebp
        mov esi, [ebp]
        mov [ebx+24], esi




        // 保存 eflags
        pushfd
        mov esi, [esp]
        add esp, 4
        mov[ebx + 28], esi


        // 保存返回地址，栈帧基址 + 4 的位置指向的值
        mov esi, [ebp + 4]
        mov [ebx + 32], esi


        pop ebx
        pop esi
        mov esp, ebp
        pop ebp
        ret
    }
}




// {0:ebx, 1:ecx, 2:edx, 3:esi, 4:edi, 5:esp, 6:ebp, 7:eflags, 8:ret}
__declspec(naked)
void longjmp(jmp_buf env, int val) {
    __asm {
        mov eax, [esp + 8] // val
        mov ebx, [esp + 4] // env


        // 恢复 ecx, edx, edi
        mov ecx, [ebx + 4]
        mov edx, [ebx + 8]
        mov edi, [ebx + 16]


        // 恢复 eflags
        sub esp, 4
        mov esi, [ebx + 28]
        mov [esp], esi
        popfd


        // 恢复 esp , ebp
        mov ebp, [ebx + 24]
        mov esp, [ebx + 20]


        // 构造返回地址
        mov esi, [ebx + 32]
        mov [esp], esi


        // 恢复 esi
        mov esi, [ebx + 12]


        mov ebx, [ebx] // 恢复 ebx


        ret
    }
}


void doSomething() {
    int n = 0;
    scanf("%d", &n);
    if (n == 100) {
        longjmp(jmpbuf, 1);
    }


    if (n == 200) {
        longjmp(jmpbuf, 2);
    }


}


int global = 100;


int main() {


    int res = 0;
    if ((res = setjmp(jmpbuf)) != 0) {
        printf("hello! res = %d\n", res);
    }




    while (1) {
        doSomething();
    }
}
```

其实这种操作现在很常见，比如coroutine，其第一步实现就是保存当前栈帧。