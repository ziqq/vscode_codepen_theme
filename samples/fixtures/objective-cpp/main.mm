#import <Foundation/Foundation.h>

#include <algorithm>
#include <string>
#include <vector>

// Objective-C messages embedded in a C++ value-oriented model.
struct Token {
    std::string name;
    std::string color;
};

@interface ThemeBridge : NSObject
+ (NSString *)labelForName:(NSString *)name accent:(NSString *)accent;
@end

@implementation ThemeBridge
+ (NSString *)labelForName:(NSString *)name accent:(NSString *)accent {
    return [NSString stringWithFormat:@"%@: %@", name, accent];
}
@end

static std::vector<Token> visible_tokens(std::vector<Token> tokens) {
    std::erase_if(tokens, [](const Token& token) { return token.name == "comment"; });
    return tokens;
}

int main() {
    @autoreleasepool {
        auto tokens = visible_tokens({
            {"keyword", "#ddca7e"},
            {"string", "#96b38a"},
            {"comment", "#717790"},
        });
        NSString *label = [ThemeBridge labelForName:@"CodePen Theme Original"
                                             accent:@"#96b38a"];
        NSLog(@"%@ %zu", label, tokens.size());
    }
    return 0;
}
