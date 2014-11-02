from kodemon import kodemon
import time, random

@kodemon
def longTest():
	sleepFor = random.random() * 20
	print 'Test Sleeping for', sleepFor
	time.sleep(sleepFor)

def main():
	while(1):
		longTest()


if __name__ == '__main__':
	main()