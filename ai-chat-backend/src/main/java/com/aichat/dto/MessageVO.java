package com.aichat.dto;

import com.aichat.entity.Message;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageVO extends Message {
    private String dateLabel;
}
