---
title: "C++异常处理"
---


## 连个文件读取的栗子

```c
#include<stdio.h>
#include<stdlib.h>
#include<errno.h>



char* readFile(const char *path) {
	//open file.
	FILE* pfile = open(path, "r");
	if(!pfile) return 0;

	//alloc memory.
	size_t cap = 1000;
	char *buf = malloc(cap+1);
	if(!buf) return 0;

	cap = fread(buf, 1, cap, pfile);
	if(!cap && ferror(pfile)) {
		fclose(pfile);
		free(buf);
		return 0;
	}

	//successful.
	buf[cap] = '\0';
	fclose(pfile);
	return buf;
}


int main(int argc, char** args) {

	char *buf = readFile("test.txt");
	if(!buf) {
		perror("文件读取出错");
	} else {
		printf("data: \n------\n%s", buf);
		free(buf);
	}
	return 0;
}
```

```c++
#include<iostream>
#include<exception>
#include<memory>


std::unique_ptr<char> readFile(const char *path) {
	std::ifstream ifs;
	ifs.exception(::std::ios::failbit);
	ifs.open(path);

	size_t cap = 1000;
	std::unique_ptr<char> buf( new char[cap+1] );

	ifs.get(buf.get(), cap+1, 0);
	return buf;
}



int main() {

	try{

		auto buf = readFile("test.txt");
		std::cout<<buf.get()<<std::endl;
	}

	return 0;
}
```



## 概念

- **error neutrality**：具体到c的错误处理，c是没有异常处理的，在linux平台全靠errno，errno对于库函数是透明的，如open，只会设置errno，但是并不会对errno进行处理，所以是错误中立的。
- **exception neutrality**：允许函数throw;直接抛出上一个函数调用产生的异常，不对异常做处理，就叫做异常中立。
- **exception safety**：
	1. no-throw guarantee：确保没有异常抛出。
		```c++
		std::vector<T>::clear, swap这些函数都是可以保证不抛出异常的。
		```
	2. basic exception safety gurantee：基本操作保证异常安全。
	3. strong exception safety gurantee：强安全保证，如果每一个基本安全得到保证，其组合自然是强安全保证的。
		



## rollback的强安全保证

```c++
struct User {
	uint64_t uid;
	std::string name;
	int age;
}

std::map<uint64_t, std::shared_ptr<User>> users_by_uid;
std::mulitmap<std::string, std::shared_ptr<User>> users_by_name;
std::mulitmap<int, std::shared_ptr<User>> users_by_age;

void addUser(std::shared_ptr<User> user) {

	auto r1 =  users_by_uid.insert({user->uid, user}).first;
	try{
			auto r2 = users_by_name.insert({user->name, user});
			try{
				auto r3 = users_by_age.insert({user->age, user});
			}catch(...) {
				user_by_uid.erase(r2);
				throw;
			}
			
		}catch(...) {
			user_by_uid.erase(r1);
			throw;
		}
}
```

## copy and swap

```c++
struct User {
	uint64_t uid;
	std::string name;
	int age;
}

std::map<uint64_t, std::shared_ptr<User>> users_by_uid;
std::mulitmap<std::string, std::shared_ptr<User>> users_by_name;
std::mulitmap<int, std::shared_ptr<User>> users_by_age;

void addUser(std::shared_ptr<User> user) {

	auto temp_uid = users_by_uid;
	auto temp_name = users_by_name;
	auto temp_age = users_by_age;


	temp_uid.insert({user->uid, user});
	temp_name.insert({user->name, user});
	temp_age.insert({user->age, user});

	//swap.
	users_by_uid.swap(temp_uid);
	users_by_name.swap(temp_name);
	users_by_age.swap(temp_age);
}

```



## c++的异常

![](/images/cppexception.png)


### 自定义异常

```c++
#include <iostream>
#include <exception>
using namespace std;
 
struct MyException : public exception
{
  const char * what () const throw ()
  {
    return "C++ Exception";
  }
};
 
int main()
{
  try
  {
    throw MyException();
  }
  catch(MyException& e)
  {
    std::cout << "MyException caught" << std::endl;
    std::cout << e.what() << std::endl;
  }
  catch(std::exception& e)
  {
    //其他的错误
  }
}
```