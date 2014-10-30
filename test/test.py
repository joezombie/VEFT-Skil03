from kodemon import kodemon
import time, random

@kodemon
def test():
	sleepFor = random.random()
	print 'Test Sleeping for', sleepFor
	time.sleep(sleepFor)

@kodemon
def test2():
	sleepFor = random.random()
	print 'Test2 Sleeping for', sleepFor
	time.sleep(sleepFor)

def main():
	while(1):
		test()
		test2()


if __name__ == '__main__':
	main()